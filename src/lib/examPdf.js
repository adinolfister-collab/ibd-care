import jsPDF from 'jspdf';

// Genera un PDF di confronto degli esami scansionati (cronologico).
// rows: array di MedicalRecord (con markers/findings) già selezionati e
// ordinati in senso ascendente per data.
export function exportExamComparison({ categoryLabel, rows }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 56;
  const accent = [13, 148, 136];

  // Header
  doc.setFillColor(...accent);
  doc.roundedRect(M, y, 6, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('IBD Care — Confronto esami', M + 16, y + 16);
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Categoria: ${categoryLabel}`, M, y);
  y += 14;
  doc.text(`Esami inclusi: ${rows.length}`, M, y);
  y += 20;

  const ensure = (need) => {
    if (y + need > H - M) { doc.addPage(); y = M; }
  };

  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d || '—'; }
  };

  rows.forEach((r, i) => {
    ensure(70);
    // exam header bar
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(M, y, W - M * 2, 22, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text(fmtDate(r.record_date), M + 10, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const titleTxt = doc.splitTextToSize(r.title || 'Esame', 360);
    doc.text(titleTxt, M + 100, y + 15);
    y += 30;

    if (r.provider) {
      ensure(16);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Medico/centro: ${r.provider}`, M, y);
      y += 14;
    }

    const markers = Array.isArray(r.markers) ? r.markers : [];
    if (markers.length) {
      markers.forEach((m) => {
        ensure(16);
        const flag = m.flag === 'high' ? ' ↑ alto' : m.flag === 'low' ? ' ↓ basso' : '';
        const ref = (m.ref_low || m.ref_high) ? ` (rif. ${m.ref_low}-${m.ref_high})` : '';
        const line = `• ${m.name || '—'}: ${m.value || '—'}${m.unit ? ' ' + m.unit : ''}${ref}${flag}`;
        const wrapped = doc.splitTextToSize(line, W - M * 2 - 12);
        doc.setFontSize(9);
        doc.setTextColor(
          m.flag === 'high' ? 190 : m.flag === 'low' ? 170 : 51,
          m.flag === 'high' ? 40 : m.flag === 'low' ? 110 : 65,
          m.flag === 'high' ? 50 : m.flag === 'low' ? 40 : 85
        );
        doc.text(wrapped, M + 12, y);
        y += wrapped.length * 12 + 2;
      });
    }

    if (r.findings) {
      ensure(16);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Reperti:', M, y);
      y += 12;
      const wrapped = doc.splitTextToSize(r.findings, W - M * 2 - 12);
      doc.setTextColor(51, 65, 85);
      doc.text(wrapped, M + 12, y);
      y += wrapped.length * 11 + 4;
    }

    if (r.result_summary && !r.findings) {
      ensure(16);
      const wrapped = doc.splitTextToSize(r.result_summary, W - M * 2);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(wrapped, M, y);
      y += wrapped.length * 11 + 4;
    }

    y += 6;
    if (i < rows.length - 1) {
      doc.setDrawColor(226, 232, 240);
      doc.line(M, y, W - M, y);
      y += 8;
    }
  });

  // Footer on every page
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generato da IBD Care · dati privati, per uso personale e del medico curante (GDPR)', M, H - 24);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`IBD-Care-confronto-esami_${stamp}.pdf`);
}

// Genera un PDF con l'elenco cronologico degli esami (MilitaryRecord con
// exam_category), utile come riepilogo per la visita medica.
// rows: array di MedicalRecord già ordinato (di solito -record_date).
export function exportExamListPdf(rows) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 56;
  const accent = [13, 148, 136];

  const catLabels = {
    esame_sangue: 'Esame del sangue',
    calprotectina: 'Calprotectina fecale',
    colonscopia: 'Colonscopia',
    ecografia: 'Ecografia',
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
  doc.text('IBD Care — Elenco esami', M + 16, y + 16);
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Esami: ${rows.length}`, M, y);
  doc.text(`Esportato il ${new Date().toLocaleDateString('it-IT')}`, W - M, y, { align: 'right' });
  y += 22;

  const ensure = (need) => {
    if (y + need > H - M) { doc.addPage(); y = M; }
  };

  if (!rows.length) {
    ensure(20);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text('Nessun esame da esportare.', M, y);
  }

  rows.forEach((r, i) => {
    ensure(64);
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(M, y, W - M * 2, 22, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(13, 148, 136);
    doc.text(fmtDate(r.record_date), M + 10, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const titleTxt = doc.splitTextToSize(r.title || 'Esame', 360);
    doc.text(titleTxt, M + 100, y + 15);
    y += 30;

    if (r.exam_category) {
      ensure(14);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Categoria: ${catLabels[r.exam_category] || r.exam_category}`, M, y);
      y += 14;
    }
    if (r.provider) {
      ensure(14);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Medico/centro: ${r.provider}`, M, y);
      y += 14;
    }

    const markers = Array.isArray(r.markers) ? r.markers : [];
    if (markers.length) {
      markers.forEach((m) => {
        ensure(16);
        const flag = m.flag === 'high' ? ' ↑ alto' : m.flag === 'low' ? ' ↓ basso' : '';
        const ref = (m.ref_low || m.ref_high) ? ` (rif. ${m.ref_low}-${m.ref_high})` : '';
        const line = `• ${m.name || '—'}: ${m.value || '—'}${m.unit ? ' ' + m.unit : ''}${ref}${flag}`;
        const wrapped = doc.splitTextToSize(line, W - M * 2 - 12);
        doc.setFontSize(9);
        doc.setTextColor(
          m.flag === 'high' ? 190 : m.flag === 'low' ? 170 : 51,
          m.flag === 'high' ? 40 : m.flag === 'low' ? 110 : 65,
          m.flag === 'high' ? 50 : m.flag === 'low' ? 40 : 85
        );
        doc.text(wrapped, M + 12, y);
        y += wrapped.length * 12 + 2;
      });
    }

    if (r.findings) {
      ensure(16);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Reperti:', M, y);
      y += 12;
      const wrapped = doc.splitTextToSize(r.findings, W - M * 2 - 12);
      doc.setTextColor(51, 65, 85);
      doc.text(wrapped, M + 12, y);
      y += wrapped.length * 11 + 4;
    } else if (r.result_summary) {
      ensure(16);
      const wrapped = doc.splitTextToSize(r.result_summary, W - M * 2);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(wrapped, M, y);
      y += wrapped.length * 11 + 4;
    }

    y += 8;
    if (i < rows.length - 1) {
      doc.setDrawColor(226, 232, 240);
      doc.line(M, y, W - M, y);
      y += 10;
    }
  });

  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generato da IBD Care · elenco esami privato (GDPR)', M, H - 24);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`IBD-Care-elenco-esami_${stamp}.pdf`);
}