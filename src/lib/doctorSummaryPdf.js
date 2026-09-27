import jsPDF from 'jspdf';
import {
  medTypeLabel, medFrequencyLabel, painLocationLabel, moodLabel,
  localeForLang,
} from '@/lib/enumLabels';

// Genera un PDF "riepilogo per il medico" con andamento sintomi + terapie.
// params:
//  - symptoms: array SymptomEntry (già ordinato per data desc)
//  - meds: array Medication
//  - range: numero di giorni coperti dall'andamento
//  - t: funzione i18n
//  - lang: codice lingua attiva (per formattazione date)
//  - note: stringa opzionale scritta dal paziente
export function exportDoctorSummaryPdf({ symptoms, meds, range, t, lang, note }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 56;
  const accent = [13, 148, 136];
  const locale = localeForLang(lang);
  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d || '—'; }
  };

  // === Header ===
  doc.setFillColor(...accent);
  doc.roundedRect(M, y, 6, 26, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(t('doctor_pdf.title'), M + 16, y + 18);
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - (range - 1));
  doc.text(`${t('doctor_pdf.period')}: ${fmtDate(from)} — ${fmtDate(today)}`, M, y);
  doc.text(`${t('doctor_pdf.generated')}: ${today.toLocaleDateString(locale)}`, W - M, y, { align: 'right' });
  y += 22;

  // === Sintesi andamento ===
  const inRange = symptoms.filter((s) => s.entry_date && new Date(s.entry_date) >= from);
  const avg = (field) => {
    const vals = inRange.map((s) => s[field]).filter((v) => v !== null && v !== undefined);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  const max = (field) => {
    const vals = inRange.map((s) => s[field]).filter((v) => v !== null && v !== undefined);
    return vals.length ? Math.max(...vals) : null;
  };
  const bloodDays = inRange.filter((s) => s.blood).length;

  const statBox = (label, value, x, w) => {
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(x, y, w, 46, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(13, 148, 136);
    doc.text(String(value), x + 10, y + 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 10, y + 38);
  };

  const colW = (W - M * 2 - 16) / 4;
  statBox(t('doctor_pdf.avg_pain'), avg('pain_level') !== null ? avg('pain_level').toFixed(1) : '—', M, colW);
  statBox(t('doctor_pdf.avg_fatigue'), avg('fatigue_level') !== null ? avg('fatigue_level').toFixed(1) : '—', M + colW + 8, colW);
  statBox(t('doctor_pdf.max_bowel'), max('bowel_movements_count') !== null ? max('bowel_movements_count') : '—', M + (colW + 8) * 2, colW);
  statBox(t('doctor_pdf.blood_days'), String(bloodDays), M + (colW + 8) * 3, colW);
  y += 58;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`${t('doctor_pdf.entries_in_range')}: ${inRange.length} · ${t('doctor_pdf.range_label')}: ${range} ${t('doctor_pdf.days')}`, M, y);
  y += 18;

  // === Terapie ===
  const section = (title) => {
    y += 12;
    if (y + 36 > H - M) { doc.addPage(); y = M; }
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

  const line = (txt) => {
    const wrapped = doc.splitTextToSize(txt, W - M * 2);
    if (y + wrapped.length * 13 > H - M) { doc.addPage(); y = M; }
    doc.text(wrapped, M, y);
    y += wrapped.length * 13 + 2;
  };

  section(t('doctor_pdf.meds_section'));
  if (!meds || meds.length === 0) {
    line(t('doctor_pdf.no_meds'));
  } else {
    // Terapie attive prima, poi non attive
    const sorted = [...meds].sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
    sorted.forEach((m) => {
      const parts = [
        `${m.name}${m.dosage ? ' · ' + m.dosage : ''}`,
        medTypeLabel(t, m.type),
        m.frequency ? medFrequencyLabel(t, m.frequency) : '',
        m.times ? `${t('doctor_pdf.times')}: ${m.times}` : '',
        m.start_date ? `${t('doctor_pdf.start')}: ${fmtDate(m.start_date)}` : '',
        m.active ? '' : `(${t('doctor_pdf.inactive')})`,
      ].filter(Boolean);
      line(parts.join(' · '));
      if (m.notes) line(`   ${t('doctor_pdf.notes')}: ${m.notes}`);
    });
  }

  // === Diario sintomi (ultime registrazioni) ===
  section(t('doctor_pdf.symptoms_section'));
  const recent = symptoms.slice(0, 30);
  if (recent.length === 0) {
    line(t('doctor_pdf.no_symptoms'));
  } else {
    recent.forEach((s) => {
      const bits = [
        fmtDate(s.entry_date),
        `${t('doctor_pdf.pain')} ${s.pain_level ?? 0}/10`,
        `${t('doctor_pdf.fatigue')} ${s.fatigue_level ?? 0}/10`,
        `${t('doctor_pdf.bowel')} ${s.bowel_movements_count ?? 0}`,
      ];
      if (s.stool_consistency) bits.push(`${t('doctor_pdf.bristol')} ${s.stool_consistency}`);
      if (s.blood) bits.push(t('doctor_pdf.blood'));
      if (s.pain_location && s.pain_location !== 'nessuno') bits.push(painLocationLabel(t, s.pain_location));
      if (s.mood) bits.push(moodLabel(t, s.mood));
      line(bits.join(' · '));
      if (s.notes) line(`   ${s.notes}`);
    });
    if (symptoms.length > 30) line(t('doctor_pdf.more_entries').replace('{n}', String(symptoms.length - 30)));
  }

  // === Nota del paziente ===
  if (note && note.trim()) {
    section(t('doctor_pdf.note_section'));
    line(note.trim());
  }

  // === Footer ===
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(t('doctor_pdf.footer'), M, H - 24);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`IBD-Care-riepilogo-medico_${stamp}.pdf`);
}