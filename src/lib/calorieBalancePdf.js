import jsPDF from 'jspdf';
import { localeForLang } from '@/lib/enumLabels';

// Genera un PDF autonomo "Bilancio Calorico" con grafici calorie entrate/spese,
// trend del peso, medie e sintesi del range selezionato. Premium.
//
// params:
//  - dailyData: array { date, consumed, burned, steps, balance, label }
//  - weightData: array { date, weight, label }
//  - rangeLabel: etichetta localizzata del range (es. "7 giorni", "Tutto")
//  - user: { full_name, email }
//  - t, lang
export function exportCalorieBalancePdf({ dailyData, weightData, rangeLabel, user, t, lang }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  let y = 50;
  const accent = [13, 148, 136];
  const terracotta = [193, 113, 75];
  const chart2 = [22, 101, 52];
  const chart3 = [60, 80, 90];
  const locale = localeForLang(lang);
  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d || '—'; }
  };
  const ensure = (need) => { if (y + need > H - M) { doc.addPage(); y = M; } };

  // === Header ===
  doc.setFillColor(...accent);
  doc.roundedRect(M, y, 6, 30, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(t('calorie_pdf.title'), M + 16, y + 20);
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const today = new Date();
  doc.text(`${t('clinical_pdf.generated')}: ${today.toLocaleDateString(locale)}`, M, y);
  const name = user?.full_name || user?.email || t('clinical_pdf.anon');
  doc.text(`${t('clinical_pdf.patient')}: ${name}`, W - M, y, { align: 'right' });
  y += 18;
  doc.text(`${t('calorie_pdf.range')}: ${rangeLabel}`, M, y);
  y += 22;

  // === Summary stats ===
  const n = dailyData.length;
  const avgConsumed = n ? Math.round(dailyData.reduce((s, d) => s + d.consumed, 0) / n) : 0;
  const avgBurned = n ? Math.round(dailyData.reduce((s, d) => s + d.burned, 0) / n) : 0;
  const avgSteps = n ? Math.round(dailyData.reduce((s, d) => s + d.steps, 0) / n) : 0;
  const avgBalance = n ? Math.round(dailyData.reduce((s, d) => s + d.balance, 0) / n) : 0;

  ensure(80);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(M, y, W - M * 2, 70, 6, 6, 'F');
  const boxW = (W - M * 2) / 4;
  const stats = [
    { label: t('calorie.consumed'), value: avgConsumed, color: terracotta },
    { label: t('calorie.burned'), value: avgBurned, color: chart2 },
    { label: t('calorie.steps'), value: avgSteps.toLocaleString(), color: chart3 },
    { label: t('calorie.balance'), value: (avgBalance > 0 ? '+' : '') + avgBalance, color: accent },
  ];
  stats.forEach((s, i) => {
    const cx = M + i * boxW + boxW / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(s.label, cx, y + 22, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...s.color);
    doc.text(String(s.value), cx, y + 48, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('kcal/g', cx, y + 60, { align: 'center' });
  });
  y += 84;

  // === Calorie in vs out chart ===
  if (n > 0) {
    ensure(210);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(t('calorie.balance_chart_title'), M, y);
    y += 8;
    drawCalorieBars(doc, dailyData, M, y, W - M * 2, 170, terracotta, chart2, t);
    y += 190;
  }

  // === Weight trend chart ===
  if (weightData && weightData.length > 0) {
    ensure(190);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(t('calorie.weight_chart_title'), M, y);
    y += 8;
    drawWeightLine(doc, weightData, M, y, W - M * 2, 150, chart3, t);
    y += 168;
  }

  // === Daily detail table (last 14 entries) ===
  if (n > 0) {
    const rows = dailyData.slice(-14).reverse();
    ensure(40 + rows.length * 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(t('calorie_pdf.detail_title'), M, y);
    y += 14;
    // header
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(M, y, W - M * 2, 22, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const cols = [t('activity_manual.date'), t('calorie.consumed'), t('calorie.burned'), t('calorie.steps'), t('calorie.balance')];
    const colX = [M + 10, M + 150, M + 250, M + 340, M + 430];
    cols.forEach((c, i) => doc.text(c, colX[i], y + 14));
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    rows.forEach((d) => {
      ensure(18);
      doc.setTextColor(51, 65, 85);
      doc.text(fmtDate(d.date), colX[0], y + 12);
      doc.text(String(d.consumed), colX[1], y + 12);
      doc.text(String(Math.round(d.burned)), colX[2], y + 12);
      doc.text(String(d.steps.toLocaleString()), colX[3], y + 12);
      const bal = d.balance;
      doc.setTextColor(bal > 50 ? 180 : bal < -50 ? 22 : 51, bal > 50 ? 83 : bal < -50 ? 101 : 65, bal > 50 ? 9 : bal < -50 ? 52 : 85);
      doc.text((bal > 0 ? '+' : '') + bal, colX[4], y + 12);
      y += 18;
    });
  }

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
  doc.save(`IBD-Care-bilancio-calorico_${stamp}.pdf`);
}

// Grafico a barre affiancate: calorie entrate vs spese.
function drawCalorieBars(doc, data, x, y, w, h, c1, c2, t) {
  const plotX = x + 30;
  const plotY = y + 10;
  const plotW = w - 40;
  const plotH = h - 30;
  const maxVal = Math.max(10, ...data.map((d) => Math.max(d.consumed, d.burned)));
  const gridLines = [0, Math.round(maxVal / 2), maxVal];
  doc.setDrawColor(226, 232, 240);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  gridLines.forEach((g) => {
    const gy = plotY + plotH - (g / maxVal) * plotH;
    doc.line(plotX, gy, plotX + plotW, gy);
    doc.text(String(g), x + 4, gy + 3);
  });
  const n = data.length;
  const groupW = plotW / n;
  const barW = Math.min(8, groupW / 3);
  data.forEach((d, i) => {
    const gx = plotX + i * groupW + groupW / 2;
    const h1 = (d.consumed / maxVal) * plotH;
    doc.setFillColor(...c1);
    doc.rect(gx - barW - 1, plotY + plotH - h1, barW, h1, 'F');
    const h2 = (d.burned / maxVal) * plotH;
    doc.setFillColor(...c2);
    doc.rect(gx + 1, plotY + plotH - h2, barW, h2, 'F');
  });
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);
  // legend
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFillColor(...c1);
  doc.rect(plotX, plotY + plotH + 12, 8, 8, 'F');
  doc.text(t('calorie.consumed'), plotX + 12, plotY + plotH + 19);
  doc.setFillColor(...c2);
  doc.rect(plotX + 80, plotY + plotH + 12, 8, 8, 'F');
  doc.text(t('calorie.burned'), plotX + 92, plotY + plotH + 19);
  doc.setLineWidth(0.2);
}

// Grafico a linea del peso.
function drawWeightLine(doc, data, x, y, w, h, color, t) {
  const plotX = x + 30;
  const plotY = y + 10;
  const plotW = w - 40;
  const plotH = h - 30;
  if (!data.length) return;
  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = Math.max(1, maxW - minW);
  const pad = range * 0.15;
  const lo = minW - pad;
  const hi = maxW + pad;
  const gridLines = [lo, (lo + hi) / 2, hi];
  doc.setDrawColor(226, 232, 240);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  gridLines.forEach((g) => {
    const gy = plotY + plotH - ((g - lo) / (hi - lo)) * plotH;
    doc.line(plotX, gy, plotX + plotW, gy);
    doc.text(g.toFixed(1), x + 4, gy + 3);
  });
  // line
  doc.setDrawColor(...color);
  doc.setLineWidth(1.8);
  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;
  data.forEach((d, i) => {
    const px = plotX + (data.length > 1 ? i * stepX : plotW / 2);
    const py = plotY + plotH - ((d.weight - lo) / (hi - lo)) * plotH;
    if (i > 0) {
      const prev = data[i - 1];
      const ppx = plotX + (i - 1) * stepX;
      const ppy = plotY + plotH - ((prev.weight - lo) / (hi - lo)) * plotH;
      doc.line(ppx, ppy, px, py);
    }
    doc.setFillColor(...color);
    doc.circle(px, py, 2.2, 'F');
  });
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.8);
  doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);
  // first/last labels
  const fmtShort = (d) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }); } catch { return ''; } };
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(fmtShort(data[0].date), plotX, plotY + plotH + 11);
  doc.text(fmtShort(data[data.length - 1].date), plotX + plotW, plotY + plotH + 11, { align: 'right' });
  doc.setLineWidth(0.2);
}

// Calcola una sezione "Bilancio calorico e peso" da includere nel PDF clinico
// di Prepara la visita. Restituisce un oggetto con medie e andamento peso,
// pronto per essere disegnato da drawCalorieWeightSection().
export function summarizeCalorieWeight(activities, weights) {
  const daily = {};
  for (const a of activities || []) {
    const d = a.entry_date;
    if (!daily[d]) daily[d] = { date: d, consumed: 0, burned: 0, steps: 0 };
    daily[d].burned += a.kcal_expended || 0;
    daily[d].steps += a.steps || 0;
  }
  const vals = Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));
  const n = vals.length;
  const avgBurned = n ? Math.round(vals.reduce((s, d) => s + d.burned, 0) / n) : 0;
  const avgSteps = n ? Math.round(vals.reduce((s, d) => s + d.steps, 0) / n) : 0;
  const wSorted = [...(weights || [])].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const firstW = wSorted[0];
  const lastW = wSorted[wSorted.length - 1];
  const weightDelta = firstW && lastW ? +(lastW.weight_kg - firstW.weight_kg).toFixed(1) : null;
  return {
    days: n,
    avgBurned,
    avgSteps,
    weightFirst: firstW?.weight_kg || null,
    weightLast: lastW?.weight_kg || null,
    weightDelta,
    weightPoints: wSorted.map((w) => ({ date: w.entry_date, weight: w.weight_kg })),
  };
}

// Disegna la sezione Bilancio calorico e peso dentro il PDF clinico esistente.
export function drawCalorieWeightSection(doc, summary, x, y, w, t) {
  const accent = [13, 148, 136];
  const rows = [];
  if (summary.days > 0) {
    rows.push({ label: t('calorie_pdf.avg_burned'), value: `${summary.avgBurned} kcal/g` });
    rows.push({ label: t('calorie.steps'), value: summary.avgSteps.toLocaleString() });
  }
  if (summary.weightLast) {
    rows.push({ label: t('weight.title'), value: `${summary.weightLast} kg` });
    if (summary.weightDelta != null && summary.weightFirst !== summary.weightLast) {
      const sign = summary.weightDelta > 0 ? '+' : '';
      rows.push({ label: t('calorie_pdf.weight_delta'), value: `${sign}${summary.weightDelta} kg` });
    }
  }
  if (!rows.length) return y;
  const boxH = 30 + rows.length * 20;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, w, boxH, 6, 6, 'F');
  let ry = y + 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(t('calorie_pdf.section_title'), x + 12, ry);
  ry += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  rows.forEach((r) => {
    doc.text(r.label, x + 12, ry);
    doc.setTextColor(...accent);
    doc.setFont('helvetica', 'bold');
    doc.text(String(r.value), x + w - 12, ry, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    ry += 20;
  });
  return y + boxH + 8;
}