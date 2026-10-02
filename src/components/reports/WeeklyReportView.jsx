import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Loader2, Utensils, AlertTriangle, Droplet } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { localeForLang } from '@/lib/enumLabels';

const PRIMARY = '#0d9488';
const FATIGUE = '#f59e0b';
const BOWEL = '#0ea5e9';

// Presentational body of the weekly report (charts + stats + suspicious foods).
// Shared by the in-app WeeklyReport dialog and the public /report/:shareId
// page so the shared view is always identical to the authenticated one.
export default function WeeklyReportView({ data }) {
  const { t, lang } = useI18n();

  const fmtDay = (ds) => {
    const d = new Date(ds + 'T00:00:00');
    return d.toLocaleDateString(localeForLang(lang), { day: '2-digit', month: '2-digit' });
  };

  const chartData = data.days.map((d) => ({
    day: fmtDay(d.date),
    dolore: d.avg_pain !== null ? Number(d.avg_pain.toFixed(1)) : null,
    stanchezza: d.avg_fatigue !== null ? Number(d.avg_fatigue.toFixed(1)) : null,
    scariche: d.bowel_movements,
  }));

  const statCards = [
    { label: t('weekly_report.avg_pain'), value: `${data.stats.week_avg_pain}/10`, icon: TrendingUp, color: PRIMARY },
    { label: t('weekly_report.avg_fatigue'), value: `${data.stats.week_avg_fatigue}/10`, icon: Loader2, color: FATIGUE },
    { label: t('weekly_report.total_bowel'), value: data.stats.total_bowel, icon: Droplet, color: BOWEL },
    { label: t('weekly_report.blood_days'), value: data.stats.blood_days, icon: AlertTriangle, color: '#ef4444' },
    { label: t('weekly_report.total_meals'), value: data.stats.total_meals, icon: Utensils, color: '#22c55e' },
    { label: t('weekly_report.reaction_meals'), value: data.stats.reaction_meals, icon: AlertTriangle, color: '#f97316' },
  ];

  return (
    <div className="bg-white text-slate-800 p-4 rounded-lg space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <p className="text-xl font-bold">{t('weekly_report.header')}</p>
          <p className="text-sm text-slate-500">{t('weekly_report.period')} {data.period.from} — {data.period.to}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: PRIMARY }}>
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 p-3">
            <s.icon className="w-4 h-4 mb-1" style={{ color: s.color }} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-sm font-semibold mb-2">{t('weekly_report.trend_title')}</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="dolore" name={t('weekly_report.avg_pain')} stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="stanchezza" name={t('weekly_report.avg_fatigue')} stroke={FATIGUE} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-sm font-semibold mb-2">{t('weekly_report.bowel_title')}</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip />
            <Bar dataKey="scariche" name={t('weekly_report.total_bowel')} fill={BOWEL} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> {t('weekly_report.suspicious_title')}</p>
        {data.suspicious_foods.length === 0 ? (
          <p className="text-sm text-slate-500">{t('weekly_report.no_correlation')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.suspicious_foods.map((f) => (
              <span key={f.name} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: '#fef3c7', color: '#92400e' }}>
                {f.name} · {f.count}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 border-t border-slate-200 pt-2">{t('weekly_report.footer')}</p>
    </div>
  );
}