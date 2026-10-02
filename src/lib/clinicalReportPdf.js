import jsPDF from 'jspdf';
import { severityLabelKey, severityColor } from '@/lib/clinicalIndices';
import { localeForLang, bristolLabel } from '@/lib/enumLabels';

// Genera il "Riepilogo Clinico per il Gastroenterologo": PDF di 1-2 pagine
// in stile Clinical Dashboard, pensato per essere stampato e mostrato in visita.
//
// params:
//  - indices: array ClinicalIndexEntry (ordinato per data desc)
//  - symptoms: array SymptomEntry
//  - foods: array FoodEntry (per trigger_tags)
//  - user: { full_name, email } (anagrafica)
//  - t, lang
export function exportClinicalReportPdf({ indices, symptoms, foods, user, t, lang }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  let y = 50;
  const accent = [13, 148, 136];
  const locale = localeForLang(lang);
  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d || '—'; }
  };
  const ensure = (need) => { if (y + need > H - M) { doc.addPage(); y = M; } };

  // === Header anagrafico ===
  doc.setFillColor(...accent);
  doc.roundedRect(M, y, 6, 30, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(t('clinical_pdf.title'), M + 16, y + 20);
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const today = new Date();
  doc.text(`${t('clinical_pdf.generated')}: ${today.toLocaleDateString(locale)}`, M, y);
  const name = user?.full_name || user?.email || t('clinical_pdf.anon');
  doc.text(`${t('clinical_pdf.patient')}: ${name}`, W - M, y, { align: 'right' });
  y += 18;
  const from = new Date(today); from.setMonth(from.getMonth() - 6);
  doc.text(`${t('clinical_pdf.period')}: ${fmtDate(from)} — ${fmtDate(today)}`, M, y);
  y += 18;

  // === Box indice clinico in evidenza (ultimo calcolato) ===
  ensure(96);
  const sorted = [...(indices || [])].sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''));
  const latest = sorted[0];
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(M, y, W - M * 2, 78, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(t('clinical_pdf.latest_index'), M + 14, y + 18);
  if (latest) {
    const idxName = latest.index_type === 'hbi' ? t('clinical.hbi_name') : t('clinical.mayo_name');
    const sevColor = hexToRgb(severityColor(latest.severity_label));
    doc.setFontSize(26);
    doc.setTextColor(...accent);
    doc.text(String(latest.score), M + 14, y + 50);
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text(idxName, M + 50, y + 38);
    // badge severita'
    doc.setFillColor(...sevColor);
    doc.roundedRect(M + 50, y + 46, 150, 20, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(t(severityLabelKey(latest.severity_label)), M + 58, y + 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${t('clinical_pdf.date')}: ${fmtDate(latest.entry_date)}`, W - M - 14, y + 50, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(t('clinical_pdf.no_index'), M + 14, y + 50);
  }
  y += 96;

  // === Grafico trend indici (ultimi 6 mesi) ===
  ensure(190);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(t('clinical_pdf.trend_title'), M, y);
  y += 8;
  drawIndexTrend(doc, sorted.slice(0, 50).reverse(), M, y, W - M * 2, 150, t);
  y += 168;

  // === Tabella sintesi statistica ===
  ensure(120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(t('clinical_pdf.summary_title'), M, y);
  y += 14;
  drawSummaryTable(doc, symptoms, foods, M, y, W - M * 2, t, lang);
  y += 110;

  // === Footer ===
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(t('clinical_pdf.footer'), M, H - 22);
    doc.text(`${i}/${pages}`, W - M, H - 22, { align: 'right' });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`IBD-Care-riepilogo-clinico_${stamp}.pdf`);
}

// Disegna un grafico a linee del punteggio indici nel tempo usando primitive jsPDF.
function drawIndexTrend(doc, indices, x, y, w, h, t) {
  const plotX = x + 34;
  const plotY = y + 10;
  const plotW = w - 44;
  const plotH = h - 26;
  if (!indices.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(t('clinical_pdf.no_trend'), x + plotW / 2, y + h / 2, { align: 'center' });
    return;
  }
  const scores = indices.map((i) => i.score);
  const maxScore = Math.max(10, ...scores);
  const gridLines = [0, Math.round(maxScore / 2), maxScore];
  // asse Y + tacche
  doc.setDrawColor(226, 232, 240);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  gridLines.forEach((g) => {
    const gy = plotY + plotH - (g / maxScore) * plotH;
    doc.line(plotX, gy, plotX + plotW, gy);
    doc.text(String(g), x + 4, gy + 3);
  });
  // linea punteggio
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(1.8);
  const stepX = indices.length > 1 ? plotW / (indices.length - 1) : 0;
  indices.forEach((idx, i) => {
    const px = plotX + (indices.length > 1 ? i * stepX : plotW / 2);
    const py = plotY + plotH - (idx.score / maxScore) * plotH;
    if (i > 0) {
      const prev = indices[i - 1];
      const ppx = plotX + (i - 1) * stepX;
      const ppy = plotY + plotH - (prev.score / maxScore) * plotH;
      doc.line(ppx, ppy, px, py);
    }
    // punto colorato per severita'
    const c = hexToRgb(severityColor(idx.severity_label));
    doc.setFillColor(...c);
    doc.circle(px, py, 2.6, 'F');
  });
  // asse X
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);
  // prima e ultima data
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  if (indices.length) {
    const fmtShort = (d) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }); } catch { return ''; } };
    doc.text(fmtShort(indices[0].entry_date), plotX, plotY + plotH + 11);
    doc.text(fmtShort(indices[indices.length - 1].entry_date), plotX + plotW, plotY + plotH + 11, { align: 'right' });
  }
  doc.setLineWidth(0.2);
}

// Tabella sintesi: media scariche/giorno, % giorni con dolore, trigger piu' frequenti.
function drawSummaryTable(doc, symptoms, foods, x, y, w, t, lang) {
  const rows = [
    { label: t('clinical_pdf.avg_bowel_day'), compute: () => avgBowelPerDay(symptoms) },
    { label: t('clinical_pdf.pain_days_pct'), compute: () => painDaysPct(symptoms) },
  ];
  const topTriggers = topTriggerTags(foods, 3);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, w, 30 + rows.length * 22 + (topTriggers.length ? 22 : 0), 6, 6, 'F');
  let ry = y + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(t('clinical_pdf.summary_subtitle'), x + 12, ry);
  ry += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  rows.forEach((r) => {
    doc.text(r.label, x + 12, ry);
    doc.setTextColor(13, 148, 136);
    doc.setFont('helvetica', 'bold');
    doc.text(String(r.compute()), x + w - 12, ry, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    ry += 22;
  });
  if (topTriggers.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(t('clinical_pdf.top_triggers'), x + 12, ry);
    ry += 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(topTriggers.map((t2) => `${t2.name} (${t2.total})`).join('  ·  '), x + 12, ry, { maxWidth: w - 24 });
  }
}

function avgBowelPerDay(symptoms) {
  if (!symptoms || !symptoms.length) return '—';
  const byDay = new Map();
  symptoms.forEach((s) => {
    if (!s.entry_date) return;
    const cur = byDay.get(s.entry_date) || { sum: 0, n: 0 };
    cur.sum += s.bowel_movements_count || 0;
    cur.n += 1;
    byDay.set(s.entry_date, cur);
  });
  if (!byDay.size) return '—';
  const vals = Array.from(byDay.values()).map((d) => d.sum / d.n);
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}
function painDaysPct(symptoms) {
  if (!symptoms || !symptoms.length) return '—';
  const days = new Set(symptoms.filter((s) => s.pain_level >= 4 && s.entry_date).map((s) => s.entry_date));
  const total = new Set(symptoms.filter((s) => s.entry_date).map((s) => s.entry_date));
  if (!total.size) return '—';
  return `${Math.round((days.size / total.size) * 100)}%`;
}
function topTriggerTags(foods, n) {
  const map = new Map();
  (foods || []).forEach((f) => {
    (Array.isArray(f.trigger_tags) ? f.trigger_tags : []).forEach((tg) => {
      map.set(tg, (map.get(tg) || 0) + 1);
    });
  });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, total]) => ({ name, total }));
}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}