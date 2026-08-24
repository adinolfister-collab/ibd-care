import jsPDF from 'jspdf';

// Genera un PDF del diario dei sintomi (cronologico discendente).
// rows: array di SymptomEntry già selezionato e ordinato.
export function exportSymptomDiaryPdf(rows) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 56;
  const accent = [13, 148, 136];

  const moodLabels = {
    buono: 'Buono', discreto: 'Discreto', giu: 'Giù',
    ansia: 'Ansia', irritabile: 'Irritabile',
  };
  const locLabels = {
    nessuno: 'Nessuno', addome_inferiore: 'Addome inf.',
    addome_superiore: 'Addome sup.', fianco_dx: 'Fianco dx',
    fianco_sx: 'Fianco sx', generico: 'Generico',
  };

  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d || '—'; }
  };

  // Header
  doc.setFillColor(...accent);
  doc.roundedRect(M, y, 6, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('IBD Care — Diario dei sintomi', M + 16, y + 16);
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Registrazioni: ${rows.length}`, M, y);
  doc.text(`Esportato il ${new Date().toLocaleDateString('it-IT')}`, W - M, y, { align: 'right' });
  y += 22;

  const ensure = (need) => {
    if (y + need > H - M) { doc.addPage(); y = M; }
  };

  if (!rows.length) {
    ensure(20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('Nessuna registrazione da esportare.', M, y);
  }

  rows.forEach((r, i) => {
    ensure(64);
    // date bar
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(M, y, W - M * 2, 22, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text(fmtDate(r.entry_date), M + 10, y + 15);
    y += 30;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    const rest = [
      `Dolore: ${r.pain_level ?? 0}/10`,
      `Stanchezza: ${r.fatigue_level ?? 0}/10`,
      `Scariche: ${r.bowel_movements_count ?? 0}`,
      `Consistenza: ${r.stool_consistency ? 'Tipo ' + r.stool_consistency : '—'}`,
    ];
    ensure(14);
    doc.text(rest.join(' · '), M, y);
    y += 14;

    const extras = [
      r.pain_location && r.pain_location !== 'nessuno' ? `Area: ${locLabels[r.pain_location] || r.pain_location}` : '',
      r.blood ? 'Sangue: sì' : '',
      r.mood ? `Umore: ${moodLabels[r.mood] || r.mood}` : '',
    ].filter(Boolean);
    if (extras.length) {
      ensure(14);
      doc.setTextColor(100, 116, 139);
      doc.text(extras.join(' · '), M, y);
      y += 14;
    }

    if (r.notes) {
      ensure(16);
      doc.setTextColor(71, 85, 105);
      const wrapped = doc.splitTextToSize(r.notes, W - M * 2 - 12);
      doc.text(wrapped, M + 12, y);
      y += wrapped.length * 11 + 2;
    }

    y += 8;
    if (i < rows.length - 1) {
      doc.setDrawColor(226, 232, 240);
      doc.line(M, y, W - M, y);
      y += 10;
    }
  });

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generato da IBD Care · diario sintomi privato (GDPR)', M, H - 24);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`IBD-Care-diario-sintomi_${stamp}.pdf`);
}