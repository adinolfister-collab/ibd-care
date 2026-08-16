import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

function csvCell(v) {
  const s = (v ?? '').toString();
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function gatherAll() {
  const [symptoms, food, records] = await Promise.all([
    base44.entities.SymptomEntry.list('-entry_date', 1000),
    base44.entities.FoodEntry.list('-entry_date', 1000),
    base44.entities.MedicalRecord.list('-record_date', 1000),
  ]);
  return { symptoms, food, records };
}

export default function HistoryExport() {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const exportCSV = async () => {
    setBusy('csv'); setError('');
    try {
      const { symptoms, food, records } = await gatherAll();
      const lines = ['Data;Categoria;Titolo;Dettagli'];
      symptoms.forEach((s) => {
        const det = [
          `Dolore ${s.pain_level ?? 0}/10`,
          `Stanchezza ${s.fatigue_level ?? 0}/10`,
          `Scariche ${s.bowel_movements_count ?? 0}`,
          s.blood ? 'Sangue: sì' : '',
          s.mood ? `Umore: ${s.mood}` : '',
          s.notes || '',
        ].filter(Boolean).join(' · ');
        lines.push([csvCell(s.entry_date), 'Sintomo', csvCell('Registrazione sintomi'), csvCell(det)].join(';'));
      });
      food.forEach((f) => {
        const det = [
          f.meal_type || '',
          f.foods || '',
          f.reaction ? `Reazione: ${f.reaction}` : '',
          f.tolerated === false ? 'NON tollerato' : '',
          f.notes || '',
        ].filter(Boolean).join(' · ');
        lines.push([csvCell(f.entry_date), 'Pasto', csvCell(f.foods || f.meal_type || 'Pasto'), csvCell(det)].join(';'));
      });
      records.forEach((r) => {
        const det = [
          r.type || '',
          r.provider ? `Medico: ${r.provider}` : '',
          r.location ? `Struttura: ${r.location}` : '',
          r.result_summary || '',
          r.next_appointment ? `Prossimo: ${r.next_appointment}` : '',
          r.notes || '',
        ].filter(Boolean).join(' · ');
        lines.push([csvCell(r.record_date), 'Referto', csvCell(r.title || 'Referto'), csvCell(det)].join(';'));
      });
      const csv = '\uFEFF' + lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IBD-Care-storico_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Esportazione non riuscita. Riprova.');
    }
    setBusy(null);
  };

  const exportPDF = async () => {
    setBusy('pdf'); setError('');
    try {
      const { symptoms, food, records } = await gatherAll();
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const M = 48;
      let y = 56;
      const accent = [13, 148, 136];
      doc.setFillColor(...accent);
      doc.roundedRect(M, y, 6, 22, 3, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(30, 41, 59);
      doc.text('IBD Care — Storico completo', M + 16, y + 16);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(100, 116, 139);
      doc.text(`Esportato il ${new Date().toLocaleDateString('it-IT')}`, M + 16, y + 34);
      y += 60;

      const section = (title) => {
        y += 14;
        doc.setFillColor(...accent);
        doc.roundedRect(M, y, W - M * 2, 24, 4, 4, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text(title, M + 12, y + 16);
        y += 36;
        doc.setTextColor(51, 65, 85); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      };
      const line = (txt) => {
        const wrapped = doc.splitTextToSize(txt, W - M * 2);
        if (y + wrapped.length * 13 > H - M) { doc.addPage(); y = M; }
        doc.text(wrapped, M, y);
        y += wrapped.length * 13 + 2;
      };

      section('Diario dei sintomi');
      if (!symptoms.length) line('Nessuna registrazione.');
      symptoms.forEach((s) => {
        line(`${s.entry_date} — Dolore ${s.pain_level ?? 0}/10, Stanchezza ${s.fatigue_level ?? 0}/10, Scariche ${s.bowel_movements_count ?? 0}, Bristol ${s.stool_consistency ?? '-'}${s.blood ? ', sangue: sì' : ''}${s.mood ? ', umore: ' + s.mood : ''}${s.notes ? ' — ' + s.notes : ''}`);
      });

      section('Tracciamento alimentare');
      if (!food.length) line('Nessun pasto registrato.');
      food.forEach((f) => {
        line(`${f.entry_date} · ${f.meal_type || '—'} — ${f.foods}${f.reaction ? ' (reazione: ' + f.reaction + ')' : ''}${f.tolerated === false ? ' — NON tollerato' : ''}${f.notes ? ' — ' + f.notes : ''}`);
      });

      section('Esami e referti');
      if (!records.length) line('Nessun referto.');
      records.forEach((r) => {
        line(`${r.record_date} · ${r.title} (${r.type})${r.provider ? ' — ' + r.provider : ''}${r.location ? ' @ ' + r.location : ''}${r.result_summary ? ' — ' + r.result_summary : ''}${r.next_appointment ? ' — prossimo: ' + r.next_appointment : ''}${r.notes ? ' — ' + r.notes : ''}`);
      });

      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(148, 163, 184);
        doc.text('Generato da IBD Care · esportazione completa dati privati (GDPR)', M, H - 24);
      }
      doc.save(`IBD-Care-storico_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      setError('Esportazione non riuscita. Riprova.');
    }
    setBusy(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Button onClick={exportCSV} disabled={!!busy} variant="outline" className="rounded-xl h-11">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {busy === 'csv' ? 'Generazione…' : 'Scarica CSV'}
        </Button>
        <Button onClick={exportPDF} disabled={!!busy} className="rounded-xl h-11">
          <FileText className="w-4 h-4 mr-2" />
          {busy === 'pdf' ? 'Generazione…' : 'Scarica PDF'}
        </Button>
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
    </div>
  );
}