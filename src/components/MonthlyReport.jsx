import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { CalendarRange, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function curMonth() { return new Date().toISOString().slice(0, 7); }

const moodLabels = { buono: 'Buono', discreto: 'Discreto', giu: 'Giù', ansia: 'Ansia', irritabile: 'Irritabile' };
const mealLabels = { colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena', spuntino: 'Spuntino' };
const reactionLabels = { nessuna: 'Nessuna', lieve: 'Lieve', moderata: 'Moderata', severa: 'Severa' };

function monthName(m) {
  const [y, mo] = m.split('-');
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}

export default function MonthlyReport() {
  const [month, setMonth] = useState(curMonth());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setBusy(true); setError('');
    try {
      const [symptoms, food] = await Promise.all([
        base44.entities.SymptomEntry.list('-entry_date', 1000),
        base44.entities.FoodEntry.list('-entry_date', 1000),
      ]);
      const s = symptoms.filter((x) => (x.entry_date || '').startsWith(month)).sort((a, b) => (a.entry_date || '').localeCompare(b.entry_date || ''));
      const f = food.filter((x) => (x.entry_date || '').startsWith(month)).sort((a, b) => (a.entry_date || '').localeCompare(b.entry_date || ''));

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const M = 48;
      let y = 56;
      const accent = [13, 148, 136];

      // Header
      doc.setFillColor(...accent);
      doc.roundedRect(M, y, 6, 22, 3, 3, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(30, 41, 59);
      doc.text('IBD Care — Riepilogo mensile', M + 16, y + 16);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(100, 116, 139);
      doc.text(monthName(month).charAt(0).toUpperCase() + monthName(month).slice(1), M + 16, y + 34);
      y += 60;

      const section = (title) => {
        y += 14;
        if (y + 40 > H - M) { doc.addPage(); y = M; }
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

      // Quadro generale
      const avg = (arr, k) => arr.length ? (arr.reduce((a, x) => a + (x[k] ?? 0), 0) / arr.length) : 0;
      const avgPain = avg(s, 'pain_level').toFixed(1);
      const avgFatigue = avg(s, 'fatigue_level').toFixed(1);
      const avgBowel = avg(s, 'bowel_movements_count').toFixed(1);
      const bloodDays = s.filter((x) => x.blood).length;
      const maxPainRec = s.reduce((m2, x) => ((x.pain_level ?? 0) > (m2?.pain_level ?? -1) ? x : m2), null);
      const moodCounts = {};
      s.forEach((x) => { if (x.mood) moodCounts[x.mood] = (moodCounts[x.mood] || 0) + 1; });

      const mealsCount = f.length;
      const reactions = {};
      f.forEach((x) => { if (x.reaction) reactions[x.reaction] = (reactions[x.reaction] || 0) + 1; });
      const nonTolerated = f.filter((x) => x.tolerated === false).map((x) => x.foods).filter(Boolean);

      section('Quadro generale del mese');
      line(`Giorni con sintomi registrati: ${s.length}`);
      line(`Dolore medio: ${avgPain}/10 · Stanchezza media: ${avgFatigue}/10 · Scariche medie: ${avgBowel}/giorno`);
      line(`Giorni con sangue nelle feci: ${bloodDays}`);
      if (maxPainRec) line(`Picco di dolore: ${maxPainRec.pain_level}/10 il ${maxPainRec.entry_date}`);
      if (Object.keys(moodCounts).length) {
        line(`Umore: ${Object.entries(moodCounts).map(([k, v]) => `${moodLabels[k] || k} (${v})`).join(', ')}`);
      }
      line('');
      line(`Pasti registrati: ${mealsCount}`);
      if (Object.keys(reactions).length) {
        line(`Reazioni: ${Object.entries(reactions).map(([k, v]) => `${reactionLabels[k] || k} (${v})`).join(', ')}`);
      }
      if (nonTolerated.length) {
        line(`Alimenti NON tollerati: ${[...new Set(nonTolerated)].join(', ')}`);
      }

      // Andamento sintomi giorno per giorno
      section('Andamento dei sintomi (giorno per giorno)');
      if (!s.length) {
        line('Nessun sintomo registrato in questo mese.');
      } else {
        s.forEach((x) => {
          line(`${x.entry_date} — Dolore ${x.pain_level ?? 0}/10, Stanchezza ${x.fatigue_level ?? 0}/10, Scariche ${x.bowel_movements_count ?? 0}, Bristol ${x.stool_consistency ?? '-'}${x.blood ? ', sangue: sì' : ''}${x.mood ? ', umore: ' + (moodLabels[x.mood] || x.mood) : ''}${x.notes ? ' — ' + x.notes : ''}`);
        });
      }

      // Diario alimentare
      section('Diario alimentare');
      if (!f.length) {
        line('Nessun pasto registrato in questo mese.');
      } else {
        const byDate = {};
        f.forEach((x) => { (byDate[x.entry_date] = byDate[x.entry_date] || []).push(x); });
        Object.keys(byDate).sort().forEach((d) => {
          line(`${d}:`);
          byDate[d].forEach((m2) => {
            line(`   • ${mealLabels[m2.meal_type] || m2.meal_type || '—'} — ${m2.foods}${m2.reaction ? ' (reazione: ' + (reactionLabels[m2.reaction] || m2.reaction) + ')' : ''}${m2.tolerated === false ? ' — NON tollerato' : ''}${m2.notes ? ' — ' + m2.notes : ''}`);
          });
        });
      }

      // Footer
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(148, 163, 184);
        doc.text('Generato da IBD Care · riepilogo mensile privato (GDPR)', M, H - 24);
      }

      doc.save(`IBD-Care-mensile_${month}.pdf`);
    } catch (e) {
      setError('Generazione non riuscita. Riprova.');
    }
    setBusy(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><CalendarRange className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="font-semibold">Riepilogo mensile</p>
            <p className="text-sm text-muted-foreground leading-snug">Report mensile dettagliato con andamento dei sintomi e diario alimentare, pronto per le visite mediche.</p>
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Mese</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button onClick={generate} disabled={busy} className="w-full rounded-xl h-12 text-base">
          <Download className="w-5 h-5 mr-2" />
          {busy ? 'Generazione…' : 'Genera PDF mensile'}
        </Button>
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </CardContent>
    </Card>
  );
}