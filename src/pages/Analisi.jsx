import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, BarChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import {
  Activity, TrendingUp, TrendingDown, Minus, Utensils, GitCompare,
  BarChart3, LineChart as LineChartIcon, PieChart,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EmptyState from '@/components/EmptyState';
import DemoBanner from '@/components/DemoBanner';
import ChartRangeSelector from '@/components/ChartRangeSelector';
import ReadonlyBadge from '@/components/ReadonlyBadge';
import TriggerLightBadge from '@/components/TriggerLightBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { computeFoodCorrelation, buildSymptomMap } from '@/lib/correlationStats';
import { computeTriggerLights } from '@/lib/triggerLight';
import { demoSymptoms, demoFoods } from '@/lib/demoData';
import {
  getRange, DEFAULT_RANGE_KEY, FREE_RANGE_KEY,
  cutoffDateForRange, listLimitForRange,
} from '@/lib/chartRanges';
import { cn } from '@/lib/utils';

const SEVERITY = { nessuna: 0, lieve: 1, moderata: 2, severa: 3 };
const SEV_COLOR = { 1: '#f59e0b', 2: '#f97316', 3: '#ef4444' };
const PAIN_COLOR = 'hsl(8 70% 58%)';
const FATIGUE_COLOR = 'hsl(43 74% 50%)';
const TOP = 10;

function keyOf(d) { return d.toISOString().slice(0, 10); }
function fmtDay(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Analisi() {
  const { t } = useI18n();
  const { isExpired } = useSubscription();
  const { isAuthenticated } = useAuth();
  const [foods, setFoods] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState(DEFAULT_RANGE_KEY);

  const range = getRange(rangeKey);
  const rangeDays = range.days;
  const cutoff = useMemo(() => cutoffDateForRange(range), [range]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!isAuthenticated) {
        const fd = cutoff ? demoFoods.filter((x) => (x.entry_date || '') >= cutoff) : demoFoods;
        const sd = cutoff ? demoSymptoms.filter((x) => (x.entry_date || '') >= cutoff) : demoSymptoms;
        setFoods(fd);
        setEntries(sd);
        setLoading(false);
        return;
      }
      try {
        const limit = listLimitForRange(range);
        const [f, s] = await Promise.all([
          base44.entities.FoodEntry.list('-entry_date', limit),
          base44.entities.SymptomEntry.list('-entry_date', limit),
        ]);
        if (cancelled) return;
        setFoods(cutoff ? f.filter((x) => (x.entry_date || '') >= cutoff) : f);
        setEntries(cutoff ? s.filter((x) => (x.entry_date || '') >= cutoff) : s);
      } catch {
        if (!cancelled) { setFoods([]); setEntries([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cutoff, range]);

  const timeline = useMemo(() => {
    if (!entries.length && !foods.length) return [];
    const symMap = new Map();
    entries.forEach((e) => {
      if (!e.entry_date) return;
      const prev = symMap.get(e.entry_date);
      if (!prev || (e.created_date || '') > (prev.created_date || '')) symMap.set(e.entry_date, e);
    });
    const foodMap = new Map();
    foods.forEach((f) => {
      if (!f.entry_date) return;
      if (!foodMap.has(f.entry_date)) foodMap.set(f.entry_date, []);
      foodMap.get(f.entry_date).push(f);
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start;
    if (rangeDays) {
      start = new Date(today);
      start.setDate(start.getDate() - (rangeDays - 1));
    } else {
      const allDates = [
        ...entries.map((e) => e.entry_date),
        ...foods.map((f) => f.entry_date),
      ].filter(Boolean).sort();
      start = allDates.length ? new Date(allDates[0] + 'T00:00:00') : new Date(today);
    }
    start.setHours(0, 0, 0, 0);
    const days = [];
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const key = keyOf(d);
      const s = symMap.get(key);
      const dayFoods = foodMap.get(key) || [];
      const reactionLevel = dayFoods.reduce((mx, f) => Math.max(mx, SEVERITY[f.reaction] || 0), 0);
      days.push({
        date: fmtDay(d),
        pain: s ? (s.pain_level ?? null) : null,
        fatigue: s ? (s.fatigue_level ?? null) : null,
        bowel: s ? (s.bowel_movements_count ?? null) : null,
        reactionLevel,
        mealCount: dayFoods.length,
      });
    }
    return days;
  }, [entries, foods, rangeDays]);

  const triggerLights = useMemo(() => computeTriggerLights(foods, entries), [foods, entries]);
  const triggerItems = useMemo(() => Array.from(triggerLights.entries())
    .filter(([, v]) => v.occurrences >= 3)
    .sort((a, b) => {
      const order = { red: 0, yellow: 1, green: 2 };
      return order[a[1].status] - order[b[1].status] || b[1].occurrences - a[1].occurrences;
    }), [triggerLights]);

  const stats = useMemo(() => {
    const symMap = buildSymptomMap(entries);
    return computeFoodCorrelation(foods, symMap, 1);
  }, [foods, entries]);

  const painData = useMemo(
    () => stats.filter((s) => s.avgPain != null).sort((a, b) => b.avgPain - a.avgPain).slice(0, TOP),
    [stats]
  );
  const bowelData = useMemo(
    () => stats.filter((s) => s.count > 0).sort((a, b) => b.avgBowel - a.avgBowel).slice(0, TOP),
    [stats]
  );

  const summary = useMemo(() => {
    const avg = (field) => {
      const vals = entries.map((e) => e[field]).filter((v) => v !== null && v !== undefined);
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };
    const tolerated = foods.filter((f) => f.tolerated !== false).length;
    return {
      pain: avg('pain_level'),
      fatigue: avg('fatigue_level'),
      bowel: avg('bowel_movements_count'),
      meals: foods.length,
      tolerancePct: foods.length ? Math.round((tolerated / foods.length) * 100) : null,
    };
  }, [entries, foods]);

  const hasData = timeline.some((d) => d.pain !== null || d.fatigue !== null || d.mealCount > 0);
  const isFreeView = rangeKey === FREE_RANGE_KEY;

  const trendOf = (field) => {
    const vals = timeline.map((d) => d[field]).filter((v) => v !== null && v !== undefined);
    if (vals.length < 4) return 'stable';
    const half = Math.floor(vals.length / 2);
    const firstAvg = vals.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const lastAvg = vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half);
    const diff = lastAvg - firstAvg;
    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'worsening' : 'improving';
  };

  const TrendBadge = ({ dir }) => {
    const label = dir === 'improving' ? t('trends.improving') : dir === 'worsening' ? t('trends.worsening') : t('trends.stable');
    const Icon = dir === 'improving' ? TrendingDown : dir === 'worsening' ? TrendingUp : Minus;
    const color = dir === 'improving' ? 'text-emerald-600' : dir === 'worsening' ? 'text-destructive' : 'text-muted-foreground';
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs', color)}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </span>
    );
  };

  const TimelineTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0].payload;
    return (
      <div className="rounded-xl border border-border bg-card shadow-md p-3" style={{ minWidth: 180 }}>
        <p className="font-semibold text-sm mb-1">{p.date}</p>
        <p className="text-sm" style={{ color: PAIN_COLOR }}>
          {t('symptom_charts.pain')}: <span className="font-medium">{p.pain ?? '—'}</span>
        </p>
        <p className="text-sm" style={{ color: FATIGUE_COLOR }}>
          {t('symptom_charts.fatigue')}: <span className="font-medium">{p.fatigue ?? '—'}</span>
        </p>
        {p.mealCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Utensils className="w-3 h-3" /> {p.mealCount} {t('analisi.meals')}
          </p>
        )}
      </div>
    );
  };

  const barTooltipStyle = {
    borderRadius: 12,
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
    color: 'hsl(var(--card-foreground))',
    fontSize: 12,
  };

  return (
    <AppLayout>
      <PageHeader title={t('analisi.title')} subtitle={t('analisi.subtitle')} />
      <PageEditorial pageKey="analisi" />
      {!isAuthenticated && <DemoBanner />}

      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <ChartRangeSelector value={rangeKey} onChange={setRangeKey} feature="analisi_range" className="mb-0" />
        {isFreeView && isExpired && <ReadonlyBadge />}
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : !hasData && triggerItems.length === 0 ? (
        <EmptyState icon={PieChart} title={t('analisi.no_data')} description={t('analisi.no_data_desc')} />
      ) : (
        <div className="space-y-6 md:space-y-8">
          {/* Summary cards */}
          {hasData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t('symptom_charts.pain')}</p>
                  <div className="flex items-end justify-between mt-1">
                    <p className="text-2xl font-semibold">{summary.pain !== null ? summary.pain.toFixed(1) : '—'}</p>
                    <TrendBadge dir={trendOf('pain')} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t('symptom_charts.fatigue')}</p>
                  <div className="flex items-end justify-between mt-1">
                    <p className="text-2xl font-semibold">{summary.fatigue !== null ? summary.fatigue.toFixed(1) : '—'}</p>
                    <TrendBadge dir={trendOf('fatigue')} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t('symptoms.bowel')}</p>
                  <p className="text-2xl font-semibold mt-1">{summary.bowel !== null ? summary.bowel.toFixed(1) : '—'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t('analisi.meals')}</p>
                  <div className="flex items-end justify-between mt-1">
                    <p className="text-2xl font-semibold">{summary.meals}</p>
                    {summary.tolerancePct !== null && (
                      <span className="text-xs text-emerald-600 font-medium">{summary.tolerancePct}%</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Trigger food semaphore */}
          {triggerItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="inline-flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  </span>
                  {t('trigger.light_title')}
                </CardTitle>
                <CardDescription>{t('trigger.legend')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {triggerItems.map(([name, v]) => (
                    <span key={name} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-sm">
                      <TriggerLightBadge status={v.status} />
                      <span className="font-medium">{name}</span>
                      <span className="text-xs text-muted-foreground">({v.occurrences})</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Symptom timeline with meal overlay */}
          {hasData && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-chart-2" />
                  {t('analisi.timeline_title')}
                </CardTitle>
                <CardDescription>{t('analisi.timeline_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeline} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" minTickGap={20} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                      <Tooltip content={<TimelineTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="pain"
                        name={t('symptom_charts.pain')}
                        stroke={PAIN_COLOR}
                        strokeWidth={3}
                        connectNulls
                        dot={(p) => {
                          const lvl = p.payload.reactionLevel;
                          if (!lvl) return <circle key={p.index} cx={p.cx} cy={p.cy} r={2.5} fill={PAIN_COLOR} />;
                          return (
                            <g key={p.index}>
                              <circle cx={p.cx} cy={p.cy} r={5} fill="none" stroke={SEV_COLOR[lvl]} strokeWidth={2} />
                              <circle cx={p.cx} cy={p.cy} r={2.5} fill={PAIN_COLOR} />
                            </g>
                          );
                        }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="fatigue"
                        name={t('symptom_charts.fatigue')}
                        stroke={FATIGUE_COLOR}
                        strokeWidth={2}
                        connectNulls
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-orange-500" />
                  {t('trends.hint')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Top trigger foods — pain correlation */}
          {painData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-chart-1" />
                  {t('correlazioni.pain_title')}
                </CardTitle>
                <CardDescription>{t('correlazioni.pain_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={painData} layout="vertical" margin={{ left: 8, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="item" width={110} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip cursor={{ fill: 'hsl(var(--accent))' }} contentStyle={barTooltipStyle} />
                      <Bar dataKey="avgPain" name={t('symptoms.pain')} fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top trigger foods — bowel correlation */}
          {bowelData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-chart-2" />
                  {t('correlazioni.bowel_title')}
                </CardTitle>
                <CardDescription>{t('correlazioni.bowel_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bowelData} layout="vertical" margin={{ left: 8, right: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="item" width={110} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip cursor={{ fill: 'hsl(var(--accent))' }} contentStyle={barTooltipStyle} />
                      <Bar dataKey="avgBowel" name={t('symptoms.bowel')} fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deep dive links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('analisi.deep_dive')}</CardTitle>
              <CardDescription>{t('analisi.deep_dive_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link to="/trends" className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-terracotta/50 transition-colors">
                  <span className="w-10 h-10 rounded-xl bg-accent group-hover:bg-terracotta/15 flex items-center justify-center shrink-0 transition-colors">
                    <LineChartIcon className="w-5 h-5 text-primary" />
                  </span>
                  <span className="font-heading text-base font-medium truncate">{t('nav.trends')}</span>
                </Link>
                <Link to="/symptom-charts" className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-terracotta/50 transition-colors">
                  <span className="w-10 h-10 rounded-xl bg-accent group-hover:bg-terracotta/15 flex items-center justify-center shrink-0 transition-colors">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </span>
                  <span className="font-heading text-base font-medium truncate">{t('nav.symptom_charts')}</span>
                </Link>
                <Link to="/correlazioni" className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-terracotta/50 transition-colors">
                  <span className="w-10 h-10 rounded-xl bg-accent group-hover:bg-terracotta/15 flex items-center justify-center shrink-0 transition-colors">
                    <GitCompare className="w-5 h-5 text-primary" />
                  </span>
                  <span className="font-heading text-base font-medium truncate">{t('nav.correlazioni')}</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}