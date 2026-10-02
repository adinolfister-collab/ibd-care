import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { CalendarRange, Download } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { localeForLang, moodLabel, mealTypeLabel, reactionLabel } from '@/lib/enumLabels';
import PremiumLockBadge from '@/components/PremiumLockBadge';
import PremiumExportButton from '@/components/PremiumExportButton';
import ShareReportButton from '@/components/reports/ShareReportButton';
import { useSubscription } from '@/hooks/useSubscription';

function curMonth() { return new Date().toISOString().slice(0, 7); }

function monthName(m, lang) {
  const [y, mo] = m.split('-');
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString(localeForLang(lang), { month: 'long', year: 'numeric' });
}

export default function MonthlyReport() {
  const { t, lang } = useI18n();
  const { isExpired } = useSubscription();
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
      doc.text(t('monthly_report.pdf_header'), M + 16, y + 16);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(100, 116, 139);
      const mn = monthName(month, lang);
      doc.text(mn.charAt(0).toUpperCase() + mn.slice(1), M + 16, y + 34);
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

      section(t('monthly_report.pdf_overview'));
      line(t('monthly_report.pdf_days_symptoms').replace('{n}', s.length));
      line(t('monthly_report.pdf_avg_line').replace('{p}', avgPain).replace('{f}', avgFatigue).replace('{b}', avgBowel));
      line(t('monthly_report.pdf_blood_days').replace('{n}', bloodDays));
      if (maxPainRec) line(t('monthly_report.pdf_pain_peak').replace('{p}', maxPainRec.pain_level).replace('{date}', maxPainRec.entry_date));
      if (Object.keys(moodCounts).length) {
        line(`${t('monthly_report.pdf_mood')} ${Object.entries(moodCounts).map(([k, v]) => `${moodLabel(t, k)} (${v})`).join(', ')}`);
      }
      line('');
      line(t('monthly_report.pdf_meals_count').replace('{n}', mealsCount));
      if (Object.keys(reactions).length) {
        line(`${t('monthly_report.pdf_reactions')} ${Object.entries(reactions).map(([k, v]) => `${reactionLabel(t, k)} (${v})`).join(', ')}`);
      }
      if (nonTolerated.length) {
        line(`${t('monthly_report.pdf_not_tolerated')} ${[...new Set(nonTolerated)].join(', ')}`);
      }

      // Andamento sintomi giorno per giorno
      section(t('monthly_report.pdf_symptom_trend'));
      if (!s.length) {
        line(t('monthly_report.pdf_no_symptoms'));
      } else {
        s.forEach((x) => {
          const blood = x.blood ? t('monthly_report.pdf_blood_yes') : '';
          const mood = x.mood ? t('monthly_report.pdf_mood_tag') + moodLabel(t, x.mood) : '';
          const notes = x.notes ? ' — ' + x.notes : '';
          line(`${x.entry_date} — ${x.pain_level ?? 0}/10, ${x.fatigue_level ?? 0}/10, ${x.bowel_movements_count ?? 0}, Bristol ${x.stool_consistency ?? '-'}${blood}${mood}${notes}`);
        });
      }

      // Diario alimentare
      section(t('monthly_report.pdf_food_diary'));
      if (!f.length) {
        line(t('monthly_report.pdf_no_meals'));
      } else {
        const byDate = {};
        f.forEach((x) => { (byDate[x.entry_date] = byDate[x.entry_date] || []).push(x); });
        Object.keys(byDate).sort().forEach((d) => {
          line(`${d}:`);
          byDate[d].forEach((m2) => {
            const reaction = m2.reaction ? t('monthly_report.pdf_reaction_tag').replace('{r}', reactionLabel(t, m2.reaction)) : '';
            const notTol = m2.tolerated === false ? t('monthly_report.pdf_not_tolerated_tag') : '';
            const notes = m2.notes ? ' — ' + m2.notes : '';
            line(`   • ${mealTypeLabel(t, m2.meal_type) || '—'} — ${m2.foods}${reaction}${notTol}${notes}`);
          });
        });
      }

      // Footer
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(148, 163, 184);
        doc.text(t('monthly_report.pdf_footer'), M, H - 24);
      }

      doc.save(`${t('monthly_report.export_filename')}_${month}.pdf`);
    } catch (e) {
      setError(t('monthly_report.pdf_error'));
    }
    setBusy(false);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><CalendarRange className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="font-semibold flex items-center gap-1.5">
              {t('monthly_report.card_title')}
              {isExpired && <PremiumLockBadge />}
            </p>
            <p className="text-sm text-muted-foreground leading-snug">{t('monthly_report.card_desc')}</p>
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">{t('monthly_report.month_label')}</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <PremiumExportButton
          onExport={generate}
          label={t('monthly_report.generate_btn')}
          lockedLabel={t('monthly_report.locked') || t('summary.pdf_locked')}
          feature="monthly_pdf"
          icon={Download}
          className="w-full h-12 text-base"
        />
        <ShareReportButton
          reportType="monthly"
          buildReportData={async () => {
            const [symptoms, food] = await Promise.all([
              base44.entities.SymptomEntry.list('-entry_date', 1000),
              base44.entities.FoodEntry.list('-entry_date', 1000),
            ]);
            return {
              month,
              lang,
              symptoms: symptoms.filter((x) => (x.entry_date || '').startsWith(month)),
              foods: food.filter((x) => (x.entry_date || '').startsWith(month)),
            };
          }}
          variant="outline"
          className="w-full h-11"
        />
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </CardContent>
    </Card>
  );
}