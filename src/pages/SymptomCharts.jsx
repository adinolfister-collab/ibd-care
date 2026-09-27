import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Utensils } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import EmptyState from '@/components/EmptyState';
import MealSymptomCorrelation from '@/components/MealSymptomCorrelation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { reactionLabel } from '@/lib/enumLabels';

const PAIN_COLOR = 'hsl(8 70% 58%)';
const FATIGUE_COLOR = 'hsl(43 74% 50%)';
const REACTION_COLORS = {
  nessuna: 'hsl(142 71% 45%)',
  lieve: 'hsl(43 74% 50%)',
  moderata: 'hsl(25 95% 53%)',
  severa: 'hsl(0 84% 60%)',
};
const REACTION_ORDER = ['nessuna', 'lieve', 'moderata', 'severa'];

function keyOf(d) { return d.toISOString().slice(0, 10); }
function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Monday=0
  x.setDate(x.getDate() - day);
  return x;
}
function fmtWeek(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}
function fmtMonth(d, lang) {
  try {
    return new Date(d).toLocaleDateString(lang === 'it' ? 'it-IT' : lang, { month: 'short' });
  } catch {
    return `m${d.getMonth() + 1}`;
  }
}

function ChartTooltip({ active, payload, t }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card shadow-md p-3" style={{ minWidth: 180 }}>
      <p className="font-semibold text-sm mb-1">{p.label}</p>
      <p className="text-sm" style={{ color: PAIN_COLOR }}>
        {t('symptom_charts.pain')}: <span className="font-medium">{p.pain ?? '—'}</span>
      </p>
      <p className="text-sm" style={{ color: FATIGUE_COLOR }}>
        {t('symptom_charts.fatigue')}: <span className="font-medium">{p.fatigue ?? '—'}</span>
      </p>
      <p className="text-xs text-muted-foreground mt-1">{p.count} {t('symptom_charts.entries')}</p>
    </div>
  );
}

function MealChartTooltip({ active, payload, t }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card shadow-md p-3" style={{ minWidth: 180 }}>
      <p className="font-semibold text-sm mb-1.5">{p.label}</p>
      <p className="text-sm mb-1">{t('symptom_charts.meals_count')}: <span className="font-medium">{p.count}</span></p>
      {REACTION_ORDER.map((r) => p[r] > 0 && (
        <p key={r} className="text-sm flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: REACTION_COLORS[r] }} />
          {reactionLabel(t, r)}: <span className="font-medium">{p[r]}</span>
        </p>
      ))}
    </div>
  );
}

export default function SymptomCharts() {
  const { t, lang } = useI18n();
  const [entries, setEntries] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('weekly');
  const [view, setView] = useState('trend');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [symp, food] = await Promise.all([
          base44.entities.SymptomEntry.list('-entry_date', 1000),
          base44.entities.FoodEntry.list('-entry_date', 1000),
        ]);
        if (!alive) return;
        setEntries(symp);
        setFoods(food);
      } catch {
        if (alive) { setEntries([]); setFoods([]); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const buckets = useMemo(() => {
    if (!entries || !entries.length) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out = [];

    if (mode === 'weekly') {
      const thisWeek = startOfWeek(today);
      for (let i = 7; i >= 0; i--) {
        const start = new Date(thisWeek);
        start.setDate(start.getDate() - 7 * i);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        out.push(buildBucket(entries, keyOf(start), keyOf(end), fmtWeek(start)));
      }
    } else {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      for (let i = 5; i >= 0; i--) {
        const start = new Date(monthStart.getFullYear(), monthStart.getMonth() - i, 1);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        out.push(buildBucket(entries, keyOf(start), keyOf(end), fmtMonth(start, lang)));
      }
    }
    return out;
  }, [entries, mode, lang]);

  const stats = useMemo(() => {
    const all = (entries || []).filter((e) => e.entry_date);
    const avg = (field) => {
      const vals = all.map((e) => e[field]).filter((v) => v !== null && v !== undefined);
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    const trendOf = (field, bucketsArr) => {
      const filled = bucketsArr.filter((b) => b[field] !== null);
      if (filled.length < 2) return 'stable';
      const half = Math.floor(filled.length / 2);
      const firstAvg = filled.slice(0, half).reduce((a, b) => a + b[field], 0) / half;
      const lastAvg = filled.slice(half).reduce((a, b) => a + b[field], 0) / (filled.length - half);
      const diff = lastAvg - firstAvg;
      if (Math.abs(diff) < 0.5) return 'stable';
      return diff > 0 ? 'worsening' : 'improving';
    };
    return {
      painAvg: avg('pain_level'),
      fatigueAvg: avg('fatigue_level'),
      count: all.length,
      painTrend: trendOf('pain', buckets),
      fatigueTrend: trendOf('fatigue', buckets),
    };
  }, [entries, buckets]);

  const mealBuckets = useMemo(() => {
    if (!foods || !foods.length) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out = [];

    if (mode === 'weekly') {
      const thisWeek = startOfWeek(today);
      for (let i = 7; i >= 0; i--) {
        const start = new Date(thisWeek);
        start.setDate(start.getDate() - 7 * i);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        out.push(buildMealBucket(foods, keyOf(start), keyOf(end), fmtWeek(start)));
      }
    } else {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      for (let i = 5; i >= 0; i--) {
        const start = new Date(monthStart.getFullYear(), monthStart.getMonth() - i, 1);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        out.push(buildMealBucket(foods, keyOf(start), keyOf(end), fmtMonth(start, lang)));
      }
    }
    return out;
  }, [foods, mode, lang]);

  const mealStats = useMemo(() => {
    const total = mealBuckets.reduce((a, b) => a + b.count, 0);
    const tolerated = mealBuckets.reduce((a, b) => a + (b.nessuna || 0), 0);
    return { total, toleratedPct: total ? Math.round((tolerated / total) * 100) : null };
  }, [mealBuckets]);

  const TrendBadge = ({ dir }) => {
    const label = dir === 'improving' ? t('symptom_charts.improving') : dir === 'worsening' ? t('symptom_charts.worsening') : t('symptom_charts.stable');
    const Icon = dir === 'improving' ? TrendingDown : dir === 'worsening' ? TrendingUp : Minus;
    const color = dir === 'improving' ? 'text-emerald-600' : dir === 'worsening' ? 'text-destructive' : 'text-muted-foreground';
    return (
      <span className={cn('inline-flex items-center gap-1 text-sm', color)}>
        <Icon className="w-4 h-4" /> {label}
      </span>
    );
  };

  const hasSymptomData = buckets.some((b) => b.pain !== null || b.fatigue !== null);
  const hasMealData = mealBuckets.some((b) => b.count > 0);
  const hasData = hasSymptomData || hasMealData;

  return (
    <AppLayout>
      <PageHeader title={t('symptom_charts.title')} subtitle={t('symptom_charts.subtitle')} />
      <PageEditorial pageKey="symptomcharts" />

      <div className="flex items-center gap-2 mb-4">
        {['trend', 'correlation'].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              view === v ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
            )}
          >
            {v === 'trend' ? t('symptom_charts.view_trend') : <span className="inline-flex items-center gap-1.5"><Utensils className="w-4 h-4" />{t('symptom_charts.view_correlation')}</span>}
          </button>
        ))}
      </div>

      {view === 'trend' && (
      <div className="flex items-center gap-2 mb-4">
        {['weekly', 'monthly'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              mode === m ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
            )}
          >
            {t('symptom_charts.' + m)}
          </button>
        ))}
      </div>
      )}

      {view === 'correlation' && !loading && (entries?.length || foods.length) ? (
        <MealSymptomCorrelation entries={entries} foods={foods} />
      ) : loading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : !hasData ? (
        <EmptyState icon={BarChart3} title={t('symptom_charts.no_data')} />
      ) : (
        <div className="space-y-5">
          {hasSymptomData && (
          <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('symptom_charts.pain')}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-3xl font-semibold">{stats.painAvg !== null ? stats.painAvg.toFixed(1) : '—'}</p>
                <TrendBadge dir={stats.painTrend} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('symptom_charts.fatigue')}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <p className="text-3xl font-semibold">{stats.fatigueAvg !== null ? stats.fatigueAvg.toFixed(1) : '—'}</p>
                <TrendBadge dir={stats.fatigueTrend} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-lg">{t('symptom_charts.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={buckets} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" minTickGap={12} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip t={t} />} />
                    <Legend />
                    <Line type="monotone" dataKey="pain" name={t('symptom_charts.pain')} stroke={PAIN_COLOR} strokeWidth={3} connectNulls dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="fatigue" name={t('symptom_charts.fatigue')} stroke={FATIGUE_COLOR} strokeWidth={3} connectNulls dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          </>
          )}

          {hasMealData && (
          <Card>
            <CardHeader className="pb-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2"><Utensils className="w-5 h-5 text-primary" />{t('symptom_charts.meals_title')}</CardTitle>
                  <CardDescription>{t('symptom_charts.meals_subtitle')}</CardDescription>
                </div>
                {mealStats.toleratedPct !== null && (
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-semibold leading-none">{mealStats.total}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('symptom_charts.meals_total')} · {mealStats.toleratedPct}% {t('symptom_charts.meals_tolerated')}</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mealBuckets} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" minTickGap={12} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <Tooltip content={<MealChartTooltip t={t} />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} />
                    <Legend />
                    {REACTION_ORDER.map((r) => (
                      <Bar key={r} dataKey={r} stackId="a" name={reactionLabel(t, r)} fill={REACTION_COLORS[r]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      )}
      <EditorialBlock sectionKey="symptomcharts_detail" align="left" />
    </AppLayout>
  );
}

function buildBucket(entries, startKey, endKey, label) {
  const inRange = entries.filter((e) => e.entry_date && e.entry_date >= startKey && e.entry_date <= endKey);
  const avg = (field) => {
    const vals = inRange.map((e) => e[field]).filter((v) => v !== null && v !== undefined);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };
  return { label, pain: avg('pain_level'), fatigue: avg('fatigue_level'), count: inRange.length };
}

function buildMealBucket(foods, startKey, endKey, label) {
  const inRange = foods.filter((f) => f.entry_date && f.entry_date >= startKey && f.entry_date <= endKey);
  const counts = { nessuna: 0, lieve: 0, moderata: 0, severa: 0 };
  inRange.forEach((f) => {
    const r = f.reaction && REACTION_ORDER.includes(f.reaction) ? f.reaction : 'nessuna';
    counts[r] += 1;
  });
  return { label, count: inRange.length, ...counts };
}