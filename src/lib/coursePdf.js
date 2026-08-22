import jsPDF from 'jspdf';

// Genera un PDF "Decorso" stampabile per la visita medica.
// series: array giornaliero (già filtrato per periodo) conCampi:
//   { fullDate, date, pain, fatigue, bowel, stool, mood (num|null), moodKey, blood (bool) }
// t: funzione i18n; lang: codice lingua (per locale date); rangeLabel: etichetta periodo.
export function exportCoursePdf({ series, t, lang, rangeLabel }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 56;
  const accent = [193, 102, 74]; // terracotta

  const withData = series.filter((s) =>
    s.pain !== null || s.fatigue !== null || s.bowel !== null ||
    s.stool !== null || s.mood !== null || s.blood
  );

  // Header
  doc.setFillColor(...accent);
  doc.roundedRect(M, y, 6, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(t('decorso.pdf_title'), M + 16, y + 16);
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${t('decorso.period')}: ${rangeLabel}`, M, y);
  y += 14;
  const first = withData[0]?.fullDate;
  const last = withData[withData.length - 1]?.fullDate;
  if (first && last) {
    const loc = lang === 'it' ? 'it-IT' : undefined;
    const fmt = (d) => { try { return new Date(d).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };
    doc.text(`${fmt(first)} — ${fmt(last)}`, M, y);
    y += 14;
  }
  doc.text(`${withData.length} ${t('symptom_charts.entries')}`, M, y);
  y += 22;

  const ensure = (need) => { if (y + need > H - M) { doc.addPage(); y = M; } };

  // Medie del periodo
  const avg = (field) => {
    const vals = series.map((s) => s[field]).filter((v) => v !== null && v !== undefined);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  const moodLabel = (key) => key ? t('decorso.mood_' + key) : '—';
  const bloodDays = series.filter((s) => s.blood).length;

  doc.setFillColor(240, 237, 232);
  doc.roundedRect(M, y, W - M * 2, 22, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(193, 102, 74);
  doc.text(t('decorso.averages'), M + 10, y + 15);
  y += 30;

  const stats = [
    [t('trends.pain'), avg('pain') !== null ? avg('pain').toFixed(1) + ' / 10' : '—'],
    [t('trends.fatigue'), avg('fatigue') !== null ? avg('fatigue').toFixed(1) + ' / 10' : '—'],
    [t('trends.bowel'), avg('bowel') !== null ? avg('bowel').toFixed(1) : '—'],
    [t('decorso.stool'), avg('stool') !== null ? avg('stool').toFixed(1) + ' / 7' : '—'],
    [t('decorso.mood'), avg('mood') !== null ? moodLabel(series.find((s) => s.moodKey)?.moodKey) : '—'],
    [t('decorso.blood'), `${bloodDays} ${t('decorso.day').toLowerCase()}`],
  ];
  stats.forEach(([k, v]) => {
    ensure(16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(k, M, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(String(v), M + 200, y);
    y += 16;
  });
  y += 12;

  // Diario giornaliero
  ensure(40);
  doc.setFillColor(240, 237, 232);
  doc.roundedRect(M, y, W - M * 2, 22, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(193, 102, 74);
  doc.text(t('decorso.timeline'), M + 10, y + 15);
  y += 30;

  const loc = lang === 'it' ? 'it-IT' : undefined;
  withData.forEach((s) => {
    ensure(16);
    const dStr = s.fullDate
      ? new Date(s.fullDate).toLocaleDateString(loc, { day: '2-digit', month: 'short' })
      : s.date;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(13, 148, 136);
    doc.text(dStr, M, y);
    const parts = [
      `${t('trends.pain').split(' ')[0]}: ${s.pain ?? '—'}`,
      `${t('trends.fatigue').split(' ')[0]}: ${s.fatigue ?? '—'}`,
      `${t('trends.bowel').split(' ')[0]}: ${s.bowel ?? '—'}`,
      `${t('decorso.stool').split(' ')[0]}: ${s.stool ?? '—'}`,
      `${t('decorso.mood')}: ${moodLabel(s.moodKey)}`,
      `${t('decorso.blood')}: ${s.blood ? t('decorso.blood_yes') : t('decorso.blood_no')}`,
    ];
    const line = doc.splitTextToSize(parts.join('   '), W - M * 2 - 70);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(line, M + 70, y);
    y += Math.max(14, line.length * 11) + 2;
  });

  // Footer GDPR
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generato da IBD Care · dati privati, per uso personale e del medico curante (GDPR)', M, H - 24);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`IBD-Care-decorso_${stamp}.pdf`);
}