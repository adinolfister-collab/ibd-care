import React, { useMemo } from 'react';
import { Sparkles, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { localeForLang } from '@/lib/enumLabels';
import { splitItems } from '@/lib/correlationStats';
import { cn } from '@/lib/utils';

function dayStr(d) { return d.toISOString().slice(0, 10); }

// Punteggio tolleranza settimanale + tavolo della tolleranza (safe foods).
// Calcolo client-side puro dagli FoodEntry degli ultimi 7 giorni.
export default function ToleranceOverview({ foods }) {
  const { t, lang } = useI18n();

  const { score, total, tolerated, safeFoods, trend } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 6); // 7 giorni inclusi oggi
    const startKey = dayStr(start);

    const week = (foods || []).filter((f) => (f.entry_date || '') >= startKey);
    const totalMeals = week.length;
    const toleratedMeals = week.filter((f) => !f.reaction || f.reaction === 'nessuna').length;

    // trend per-day tolleranza (0-100%): ultimi 7 giorni
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayStr(d);
      const dayMeals = week.filter((f) => f.entry_date === key);
      const ok = dayMeals.filter((f) => !f.reaction || f.reaction === 'nessuna').length;
      const ratio = dayMeals.length ? Math.round((ok / dayMeals.length) * 100) : null;
      const wd = d.toLocaleDateString(localeForLang(lang), { weekday: 'narrow' });
      days.push({ key, wd, ratio });
    }

    // safe foods: item dai pasti senza reazione, per frequenza
    const counts = new Map();
    week.forEach((f) => {
      if (f.reaction && f.reaction !== 'nessuna') return;
      splitItems(f.foods).forEach((item) => {
        const k = item.toLowerCase();
        counts.set(k, (counts.get(k) || 0) + 1);
      });
    });
    const safe = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 16);

    return {
      score: totalMeals ? Math.round((toleratedMeals / totalMeals) * 100) : null,
      total: totalMeals,
      tolerated: toleratedMeals,
      safeFoods: safe,
      trend: days,
    };
  }, [foods]);

  if (!total) return null;

  const tone = score == null ? 'text-muted-foreground' : score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-rose-500';

  return (
    <div className="space-y-4">
      <Card className="border border-border shadow-sm bg-gradient-to-br from-emerald-50/60 to-card">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.2em] text-emerald-700/80 mb-1">
                {t('food.tolerance_label')}
              </p>
              <div className="flex items-baseline gap-2">
                <span className={cn('font-heading text-4xl font-semibold leading-none', tone)}>
                  {score == null ? '—' : `${score}%`}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t('food.tolerance_ratio').replace('{ok}', String(tolerated)).replace('{n}', String(total))}
                </span>
              </div>
              {/* trend 7 giorni */}
              <div className="mt-3 flex items-end gap-1 h-12">
                {trend.map((d) => (
                  <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: 32 }}>
                      {d.ratio == null ? (
                        <span className="text-[0.6rem] text-muted-foreground/50">·</span>
                      ) : (
                        <div
                          className={cn('w-full rounded-sm', d.ratio >= 70 ? 'bg-emerald-400' : d.ratio >= 40 ? 'bg-amber-300' : 'bg-rose-300')}
                          style={{ height: `${Math.max(d.ratio, 6)}%` }}
                          title={`${d.ratio}%`}
                        />
                      )}
                    </div>
                    <span className="text-[0.6rem] text-muted-foreground uppercase">{d.wd}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {safeFoods.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <p className="font-heading text-base font-semibold text-foreground">{t('food.safe_title')}</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{t('food.safe_desc')}</p>
            <div className="flex flex-wrap gap-2">
              {safeFoods.map((f) => (
                <span
                  key={f.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                >
                  <span className="font-medium capitalize">{f.name}</span>
                  <span className="text-xs font-semibold rounded-full bg-emerald-100 px-1.5 py-0.5">{f.count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}