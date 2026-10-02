import React from 'react';
import { useI18n } from '@/lib/i18n';
import { localeForLang, moodLabel, mealTypeLabel, reactionLabel } from '@/lib/enumLabels';

function monthName(m, lang) {
  const [y, mo] = m.split('-');
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString(localeForLang(lang), { month: 'long', year: 'numeric' });
}

// Presentational HTML rendering of the monthly report (overview + daily
// symptom trend + food diary). Mirrors the PDF content produced by
// MonthlyReport, used by the public /report/:shareId page.
export default function MonthlyReportView({ data }) {
  const { t, lang } = useI18n();
  const { month, symptoms = [], foods = [] } = data;
  const s = [...symptoms].sort((a, b) => (a.entry_date || '').localeCompare(b.entry_date || ''));
  const f = [...foods].sort((a, b) => (a.entry_date || '').localeCompare(b.entry_date || ''));

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
  const byDate = {};
  f.forEach((x) => { (byDate[x.entry_date] = byDate[x.entry_date] || []).push(x); });

  const mn = monthName(month, lang);
  const Row = ({ label, children }) => (
    <div className="flex gap-2 text-sm py-1 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="font-medium text-slate-800">{children}</span>
    </div>
  );

  return (
    <div className="bg-white text-slate-800 p-4 rounded-lg space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <p className="text-xl font-bold">{t('monthly_report.pdf_header')}</p>
          <p className="text-sm text-slate-500 capitalize">{mn}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-600">
          <span className="text-white font-bold text-sm">M</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-semibold mb-2">{t('monthly_report.pdf_overview')}</p>
        <Row label={t('monthly_report.pdf_days_symptoms').split('{n}')[0].trim()}>{s.length}</Row>
        <Row label={t('monthly_report.pdf_avg_line').split('{p}')[0].trim()}>{avgPain}/10 · {avgFatigue}/10 · {avgBowel}</Row>
        <Row label={t('monthly_report.pdf_blood_days').split('{n}')[0].trim()}>{bloodDays}</Row>
        {maxPainRec && <Row label={t('monthly_report.pdf_pain_peak').split('{p}')[0].trim()}>{maxPainRec.pain_level}/10 — {maxPainRec.entry_date}</Row>}
        {Object.keys(moodCounts).length > 0 && (
          <Row label={t('monthly_report.pdf_mood')}>{Object.entries(moodCounts).map(([k, v]) => `${moodLabel(t, k)} (${v})`).join(', ')}</Row>
        )}
        <Row label={t('monthly_report.pdf_meals_count').split('{n}')[0].trim()}>{mealsCount}</Row>
        {Object.keys(reactions).length > 0 && (
          <Row label={t('monthly_report.pdf_reactions')}>{Object.entries(reactions).map(([k, v]) => `${reactionLabel(t, k)} (${v})`).join(', ')}</Row>
        )}
        {nonTolerated.length > 0 && (
          <Row label={t('monthly_report.pdf_not_tolerated')}>{[...new Set(nonTolerated)].join(', ')}</Row>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-semibold mb-2">{t('monthly_report.pdf_symptom_trend')}</p>
        {s.length === 0 ? (
          <p className="text-sm text-slate-500">{t('monthly_report.pdf_no_symptoms')}</p>
        ) : (
          <ul className="text-sm space-y-1">
            {s.map((x, i) => {
              const blood = x.blood ? ` · ${t('monthly_report.pdf_blood_yes')}` : '';
              const mood = x.mood ? ` · ${t('monthly_report.pdf_mood_tag')}${moodLabel(t, x.mood)}` : '';
              const notes = x.notes ? ` — ${x.notes}` : '';
              return (
                <li key={i} className="text-slate-700">
                  <span className="font-medium">{x.entry_date}</span> — {x.pain_level ?? 0}/10, {x.fatigue_level ?? 0}/10, {x.bowel_movements_count ?? 0}, Bristol {x.stool_consistency ?? '-'}{blood}{mood}{notes}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-sm font-semibold mb-2">{t('monthly_report.pdf_food_diary')}</p>
        {f.length === 0 ? (
          <p className="text-sm text-slate-500">{t('monthly_report.pdf_no_meals')}</p>
        ) : (
          Object.keys(byDate).sort().map((d) => (
            <div key={d} className="mb-2">
              <p className="text-sm font-medium text-slate-700">{d}</p>
              <ul className="text-sm text-slate-600 ml-3">
                {byDate[d].map((m2, i) => {
                  const reaction = m2.reaction ? ` · ${t('monthly_report.pdf_reaction_tag').replace('{r}', reactionLabel(t, m2.reaction))}` : '';
                  const notTol = m2.tolerated === false ? ` · ${t('monthly_report.pdf_not_tolerated_tag')}` : '';
                  const notes = m2.notes ? ` — ${m2.notes}` : '';
                  return <li key={i}>• {mealTypeLabel(t, m2.meal_type) || '—'} — {m2.foods}{reaction}{notTol}{notes}</li>;
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <p className="text-[10px] text-slate-400 border-t border-slate-200 pt-2">{t('monthly_report.pdf_footer')}</p>
    </div>
  );
}