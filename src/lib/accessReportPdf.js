import { jsPDF } from 'jspdf';
import { ACCESS_REPORT } from '@/lib/accessReportData';

// Esporta il "Report accessi IBD Care" come PDF A4. Contenuto statico preso
// dal modulo condiviso accessReportData (singola fonte di verità con la pagina
// admin). Stile coerente con doctorSummaryPdf (accent terracotta/teal).
export function exportAccessReportPdf() {
  const R = ACCESS_REPORT;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 56;
  const accent = [13, 148, 136];
  const dark = [30, 41, 59];
  const muted = [100, 116, 139];

  const today = new Date().toLocaleDateString('it-IT');

  // === Header ===
  doc.setFillColor(...accent);
  doc.roundedRect(M, y, 6, 26, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...dark);
  doc.text(R.title, M + 16, y + 18);
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(R.subtitle, M, y);
  doc.text(`${R.generatedLabel}: ${today}`, W - M, y, { align: 'right' });
  y += 22;

  // === Intro ===
  const introWrap = doc.splitTextToSize(R.intro, W - M * 2);
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.text(introWrap, M, y);
  y += introWrap.length * 13 + 8;

  // Helper: section title bar
  const section = (title) => {
    y += 14;
    if (y + 40 > H - M) { doc.addPage(); y = M; }
    doc.setFillColor(...accent);
    doc.roundedRect(M, y, W - M * 2, 24, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, M + 12, y + 16);
    y += 34;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  };

  // Helper: wrapped line
  const line = (txt, indent = 0) => {
    const wrapped = doc.splitTextToSize(txt, W - M * 2 - indent);
    if (y + wrapped.length * 13 > H - M) { doc.addPage(); y = M; }
    doc.text(wrapped, M + indent, y);
    y += wrapped.length * 13 + 2;
  };

  // === Tabella modalità ===
  section('Modalità di accesso');
  const colMode = (W - M * 2) * 0.22;
  const colWhen = (W - M * 2) * 0.42;
  const colStor = (W - M * 2) * 0.22;
  const colPrem = (W - M * 2) * 0.14;
  // header row
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(M, y, W - M * 2, 20, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...accent);
  doc.text('Modalità', M + 6, y + 14);
  doc.text('Quando si attiva', M + colMode + 6, y + 14);
  doc.text('Dove salva', M + colMode + colWhen + 6, y + 14);
  doc.text('Premium', M + colMode + colWhen + colStor + 6, y + 14);
  y += 26;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  R.modes.forEach((m) => {
    const wrap = (txt, w) => doc.splitTextToSize(txt, w - 8);
    const w1 = wrap(m.mode, colMode);
    const w2 = wrap(m.when, colWhen);
    const w3 = wrap(m.storage, colStor);
    const w4 = wrap(m.premium, colPrem);
    const lines = Math.max(w1.length, w2.length, w3.length, w4.length);
    if (y + lines * 12 > H - M) { doc.addPage(); y = M; }
    doc.text(w1, M + 6, y);
    doc.text(w2, M + colMode + 6, y);
    doc.text(w3, M + colMode + colWhen + 6, y);
    doc.text(w4, M + colMode + colWhen + colStor + 6, y);
    y += lines * 12 + 4;
  });

  // === Stati abbonamento ===
  section('Stati abbonamento (utente loggato)');
  R.subscriptionStates.forEach((s) => {
    line(`• ${s.state}: ${s.desc}`);
  });

  // === Sezioni dettaglio ===
  R.sections.forEach((sec) => {
    section(sec.title);
    sec.rows.forEach((r) => {
      line(`${r.area}: ${r.can}`);
    });
  });

  // === Flusso di conversione ===
  section('Percorsi di conversione');
  R.conversionFlow.forEach((c) => line(c));

  // === Note ===
  section('Note tecniche');
  R.notes.forEach((n) => line(`• ${n}`));

  // === Footer ===
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('IBD Care — Report accessi (interno amministratore)', M, H - 24);
    doc.text(`${i}/${pages}`, W - M, H - 24, { align: 'right' });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`IBD-Care-report-accessi_${stamp}.pdf`);
}