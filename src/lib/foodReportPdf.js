import jsPDF from 'jspdf';

// Genera un PDF "ultime 2 settimane alimentari" pronto per il gastroenterologo.
// foods: array di FoodEntry dell'utente (già filtrato alle ultime 2 settimane e
// ordinato per data desc).
export function exportFoodReportPdf(foods) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 56;
  const accent = [19, 145, 57];

  const REACT = { nessuna: 'Nessuna', lieve: 'Lieve', moderata: 'Moderata', severa: 'Severa' };
  const MEAL = { colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena', spuntino: 'Spuntino' };
  const COOK = {
    al_vapore: 'Al vapore', bollito: 'Bollito', al_forno: 'Al forno',
    piastrato: 'Piastrato', fritto: 'Fritto', crudo: 'Crudo',
  };

  const fmtDate = (d) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d || '—'; }
  };

  const splitItems = (s) => String(s || '').split(/[\n,;·•]+/).map((x) => x.trim()).filter(Boolean);

  // Header
  doc.setFillColor(...accent);
  doc.roundedRect(M, y, 6, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('IBD Care — Diario alimentare per il gastro', M + 16, y + 16);
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Pasti: ${foods.length}`, M, y);
  doc.text(`Esportato il ${new Date().toLocaleDateString('it-IT')}`, W - M, y, { align: 'right' });
  y += 22;

  // Sintesi reazioni + cotture
  const reactCounts = {};
  const cookCounts = {};
  let safeMap = new Map();
  let suspMap = new Map();
  foods.forEach((f) => {
    const r = f.reaction || 'nessuna';
    reactCounts[r] = (reactCounts[r] || 0) + 1;
    if (f.cooking_method) cookCounts[f.cooking_method] = (cookCounts[f.cooking_method] || 0) + 1;
    const items = splitItems(f.foods);
    if (r === 'nessuna') items.forEach((it) => safeMap.set(it.toLowerCase(), (safeMap.get(it.toLowerCase()) || 0) + 1));
    if (r === 'moderata' || r === 'severa') items.forEach((it) => suspMap.set(it.toLowerCase(), (suspMap.get(it.toLowerCase()) || 0) + 1));
  });

  const ensure = (need) => { if (y + need > H - M) { doc.addPage(); y = M; } };

  // Sintesi reazioni
  ensure(40);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(13, 148, 136);
  doc.text('Reazioni (ultime 2 settimane)', M, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const reactLine = Object.keys(REACT).map((k) => `${REACT[k]}: ${reactCounts[k] || 0}`).join(' · ');
  doc.text(reactLine, M, y);
  y += 16;

  // Safe foods + cibi sospetti
  const safeArr = Array.from(safeMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12);
  const suspArr = Array.from(suspMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12);
  if (safeArr.length) {
    ensure(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(22, 101, 52);
    doc.text('Cibi ben tollerati', M, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const safeLine = safeArr.map((s) => `${s.name} (${s.count})`).join(', ');
    const wrapped = doc.splitTextToSize(safeLine, W - M * 2);
    ensure(wrapped.length * 11 + 4);
    doc.text(wrapped, M, y);
    y += wrapped.length * 11 + 6;
  }
  if (suspArr.length) {
    ensure(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(190, 18, 60);
    doc.text('Cibi sospetti (reazione moderata/severa)', M, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const suspLine = suspArr.map((s) => `${s.name} (${s.count})`).join(', ');
    const wrapped2 = doc.splitTextToSize(suspLine, W - M * 2);
    ensure(wrapped2.length * 11 + 4);
    doc.text(wrapped2, M, y);
    y += wrapped2.length * 11 + 6;
  }

  // Cronologia pasti
  ensure(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(13, 148, 136);
  doc.text('Cronologia pasti', M, y);
  y += 18;

  // raggruppa per data
  const grouped = {};
  foods.forEach((f) => { (grouped[f.entry_date] = grouped[f.entry_date] || []).push(f); });
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  dates.forEach((d) => {
    ensure(28);
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(M, y, W - M * 2, 20, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(13, 148, 136);
    doc.text(fmtDate(d), M + 10, y + 14);
    y += 26;

    grouped[d].forEach((f) => {
      ensure(34);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const meal = MEAL[f.meal_type] || f.meal_type || '—';
      const react = f.reaction ? REACT[f.reaction] || f.reaction : 'Nessuna';
      const cook = f.cooking_method ? COOK[f.cooking_method] : '';
      doc.text(`${meal}${cook ? ' · ' + cook : ''} · Reazione: ${react}`, M + 4, y);
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const items = splitItems(f.foods).join(', ') || f.foods || '—';
      const wr = doc.splitTextToSize(items, W - M * 2 - 8);
      ensure(wr.length * 11 + 6);
      doc.text(wr, M + 8, y);
      y += wr.length * 11 + 2;
      if (f.notes) {
        const nw = doc.splitTextToSize(`Note: ${f.notes}`, W - M * 2 - 8);
        ensure(nw.length * 11 + 4);
        doc.setTextColor(100, 116, 139);
        doc.text(nw, M + 8, y);
        y += nw.length * 11 + 2;
      }
      y += 4;
    });
    y += 4;
  });

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Generato da IBD Care · diario alimentare privato (GDPR). Portalo alla prossima visita.', M, H - 24);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`IBD-Care-diario-alimentare_${stamp}.pdf`);
}