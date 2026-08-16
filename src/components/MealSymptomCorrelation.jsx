import React, { useMemo } from 'react';
import { Utensils, Flame, AlertTriangle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const R_TONE = { nessuna: 'text-emerald-600', lieve: 'text-amber-600', moderata: 'text-orange-600', severa: 'text-rose-500' };
const R_LABEL = { nessuna: 'Nessuna', lieve: 'Lieve', moderata: 'Moderata', severa: 'Severa' };
const R_BG = { 1: 'bg-amber-100 text-amber-700', 2: 'bg-orange-100 text-orange-700', 3: 'bg-rose-100 text-rose-700' };
const MEAL_LABEL = { colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena', spuntino: 'Spuntino' };
const SEVERITY = { nessuna: 0, lieve: 1, moderata: 2, severa: 3 };

function isS(sym) {
  if (!sym) return false;
  return (sym.pain_level ?? 0) >= 5 || (sym.fatigue_level ?? 0) >= 5 || (sym.bowel_movements_count ?? 0) >= 5 || sym.blood;
}

function splitItems(foods) {
  return String(foods || '')
    .split(/[\n,;·•]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function SymBadges({ sym, t }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {sym.pain_level != null && (
        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', sym.pain_level >= 5 ? 'bg-rose-100 text-rose-700' : 'bg-accent text-accent-foreground')}>
          {t('symptom_charts.pain').replace(' (0-10)', '')}: {sym.pain_level}{sym.pain_level >= 5 && <Activity className="w-3 h-3" />}
        </span>
      )}
      {sym.fatigue_level != null && (
        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', sym.fatigue_level >= 5 ? 'bg-rose-100 text-rose-700' : 'bg-accent text-accent-foreground')}>
          {t('symptom_charts.fatigue').replace(' (0-10)', '')}: {sym.fatigue_level}{sym.fatigue_level >= 5 && <Activity className="w-3 h-3" />}
        </span>
      )}
      {sym.bowel_movements_count != null && (
        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', sym.bowel_movements_count >= 5 ? 'bg-rose-100 text-rose-700' : 'bg-accent text-accent-foreground')}>
          {t('symptoms.bowel')}: {sym.bowel_movements_count}
        </span>
      )}
      {sym.blood && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">{t('symptoms.blood')}</span>
      )}
    </div>
  );
}

function MealsBlock({ title, meals }) {
  return (
    <div className="rounded-lg bg-card border border-border p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
        <Utensils className="w-3.5 h-3.5" />{title}
      </p>
      {meals.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">—</p>
      ) : (
        <div className="space-y-2">
          {meals.map((m, i) => (
            <div key={i} className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{MEAL_LABEL[m.meal_type] || m.meal_type || '—'}</span>
                {m.reaction && <span className={cn('font-medium', R_TONE[m.reaction])}>· {R_LABEL[m.reaction] || m.reaction}</span>}
              </div>
              <p className="text-muted-foreground leading-snug">{m.foods}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MealSymptomCorrelation({ entries, foods }) {
  const { t } = useI18n();

  const { spikes, toAvoid } = useMemo(() => {
    const symMap = new Map();
    (entries || []).forEach((e) => {
      if (!e.entry_date) return;
      const prev = symMap.get(e.entry_date);
      if (!prev || (e.created_date || '') > (prev.created_date || '')) symMap.set(e.entry_date, e);
    });
    const foodMap = new Map();
    (foods || []).forEach((f) => {
      if (!f.entry_date) return;
      (foodMap.get(f.entry_date) || foodMap.set(f.entry_date, []).get(f.entry_date)).push(f);
    });

    // spike days (desc order)
    const spikeList = [];
    const dates = Array.from(symMap.keys()).sort((a, b) => b.localeCompare(a));
    dates.forEach((d) => {
      const s = symMap.get(d);
      if (!isS(s)) return;
      const prevDate = new Date(d + 'T00:00:00');
      prevDate.setDate(prevDate.getDate() - 1);
      const prevKey = prevDate.toISOString().slice(0, 10);
      spikeList.push({
        date: d,
        sym: s,
        prevMeals: (foodMap.get(prevKey) || []).map((m) => ({ meal_type: m.meal_type, foods: m.foods, reaction: m.reaction })),
        dayMeals: (foodMap.get(d) || []).map((m) => ({ meal_type: m.meal_type, foods: m.foods, reaction: m.reaction })),
      });
    });

    // foods to avoid: items in meals same/next day before a spike
    const counts = new Map();
    (foods || []).forEach((f) => {
      if (!f.entry_date) return;
      const d = new Date(f.entry_date + 'T00:00:00');
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const keys = [f.entry_date, next.toISOString().slice(0, 10)];
      if (!keys.some((k) => isS(symMap.get(k)))) return;
      const sev = SEVERITY[f.reaction] || 0;
      splitItems(f.foods).forEach((item) => {
        const cur = counts.get(item) || { count: 0, maxSev: 0 };
        cur.count += 1;
        cur.maxSev = Math.max(cur.maxSev, sev);
        counts.set(item, cur);
      });
    });
    const avoid = Array.from(counts.entries())
      .map(([item, v]) => ({ item, ...v }))
      .sort((a, b) => b.count - a.count || b.maxSev - a.maxSev);
    return { spikes: spikeList, toAvoid: avoid };
  }, [entries, foods]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            {t('symptom_charts.foods_to_avoid')}
          </CardTitle>
          <CardDescription>{t('symptom_charts.foods_to_avoid_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {toAvoid.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('symptom_charts.no_suspicious')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {toAvoid.slice(0, 24).map((f) => (
                <span
                  key={f.item}
                  className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border', R_BG[f.maxSev] || 'bg-amber-100 text-amber-700', 'border-current/20')}
                >
                  {f.item}
                  <span className="text-xs font-semibold rounded-full bg-white/40 px-1.5 py-0.5">{f.count}</span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            {t('symptom_charts.spikes_title')}
          </CardTitle>
          <CardDescription>{t('symptom_charts.spikes_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {spikes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('symptom_charts.no_spikes')}</p>
          ) : (
            <div className="space-y-4">
              {spikes.map((s, i) => (
                <div key={i} className="rounded-xl border border-border p-4 bg-muted/30">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="font-semibold text-sm">{formatDate(s.date)}</span>
                    <SymBadges sym={s.sym} t={t} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <MealsBlock title={t('symptom_charts.day_before')} meals={s.prevMeals} />
                    <MealsBlock title={t('symptom_charts.spike_day')} meals={s.dayMeals} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(d) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return d; }
}