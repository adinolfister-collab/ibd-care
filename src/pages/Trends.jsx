import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Utensils, AlertTriangle, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/AuthContext';
import DemoBanner from '@/components/DemoBanner';
import { demoSymptoms, demoFoods } from '@/lib/demoData';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import MagazineEssay from '@/components/MagazineEssay';
import EmptyState from '@/components/EmptyState';
import MealSpikes from '@/components/MealSpikes';
import DiseaseCourse from '@/components/DiseaseCourse';
import DoctorSummaryExport from '@/components/DoctorSummaryExport';
import ChartRangeSelector from '@/components/ChartRangeSelector';
import ReadonlyBadge from '@/components/ReadonlyBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getRange, DEFAULT_RANGE_KEY, FREE_RANGE_KEY, listLimitForRange } from '@/lib/chartRanges';

const SEVERITY = { nessuna: 0, lieve: 1, moderata: 2, severa: 3 };
const SEV_COLOR = { 1: '#f59e0b', 2: '#f97316', 3: '#ef4444' };
const R_TONE = { nessuna: 'text-emerald-600', lieve: 'text-amber-600', moderata: 'text-orange-600', severa: 'text-rose-500' };

function fmtDay(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}
function keyOf(d) { return d.toISOString().slice(0, 10); }

function TrendsTooltip({ active, payload, field, color, label, t, overlay }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const val = p[field];
  const meals = p.meals || [];
  const rLabel = (v) => ({
    nessuna: t('trends.r_none'), lieve: t('trends.r_mild'),
    moderata: t('trends.r_mod'), severa: t('trends.r_sev'),
  }[v]);
  return (
    <div className="rounded-xl border border-border bg-card shadow-md p-3" style={{ minWidth: 200, maxWidth: 280 }}>
      <p className="font-semibold text-sm">{p.date}</p>
      <p className="text-sm mt-0.5" style={{ color }}>
        {label}: <span className="font-medium">{val !== null && val !== undefined ? val : '—'}</span>
      </p>
      {overlay && meals.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">{t('trends.meals')}</p>
          {meals.map((m, i) => (
            <div key={i} className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{m.meal_type ? t('meal.' + m.meal_type) : '—'}</span>
                {m.reaction && <span className={cn('font-medium', R_TONE[m.reaction])}>· {rLabel(m.reaction)}</span>}
              </div>
              <p className="text-muted-foreground leading-snug line-clamp-3">{m.foods}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Trends() {
  const { t } = useI18n();
  const { isExpired } = useSubscription();
  const { isAuthenticated } = useAuth();
  const [entries, setEntries] = useState(null);
  const [foods, setFoods] = useState([]);
  const [rangeKey, setRangeKey] = useState(DEFAULT_RANGE_KEY);
  const [loading, setLoading] = useState(true);
  const [overlay, setOverlay] = useState(true);

  const range = getRange(rangeKey);
  const rangeDays = range.days; // null per storico completo

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isAuthenticated) {
        setEntries(demoSymptoms);
        setFoods(demoFoods);
        setLoading(false);
        return;
      }
      try {
        const limit = listLimitForRange(range);
        const [symp, food] = await Promise.all([
          base44.entities.SymptomEntry.list('-entry_date', limit),
          base44.entities.FoodEntry.list('-entry_date', limit),
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
  }, [range]);

  const { series, suspicious } = useMemo(() => {
    const out = { series: [], suspicious: [] };
    if (!entries || entries.length === 0) return out;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // symptom by date (latest entry wins)
    const symMap = new Map();
    entries.forEach((e) => {
      if (!e.entry_date) return;
      const prev = symMap.get(e.entry_date);
      if (!prev || (e.created_date || '') > (prev.created_date || '')) symMap.set(e.entry_date, e);
    });
    // foods by date
    const foodMap = new Map();
    foods.forEach((f) => {
      if (!f.entry_date) return;
      (foodMap.get(f.entry_date) || foodMap.set(f.entry_date, []).get(f.entry_date)).push(f);
    });

    // finestra: 7/15/30/90 giorni oppure dal primo record disponibile (storico)
    let start;
    if (rangeDays) {
      start = new Date(today);
      start.setDate(start.getDate() - (rangeDays - 1));
    } else {
      const allDates = [
        ...(entries || []).map((e) => e.entry_date),
        ...(foods || []).map((f) => f.entry_date),
      ].filter(Boolean).sort();
      start = allDates.length ? new Date(allDates[0] + 'T00:00:00') : new Date(today);
    }
    start.setHours(0, 0, 0, 0);

    const days = [];
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const key = keyOf(d);
      const s = symMap.get(key);
      const dayMeals = (foodMap.get(key) || []).map((m) => ({
        meal_type: m.meal_type, foods: m.foods, reaction: m.reaction,
      }));
      const reactionLevel = (foodMap.get(key) || []).reduce(
        (mx, m) => Math.max(mx, SEVERITY[m.reaction] || 0), 0
      );
      days.push({
        date: fmtDay(d),
        pain: s ? (s.pain_level ?? null) : null,
        fatigue: s ? (s.fatigue_level ?? null) : null,
        bowel: s ? (s.bowel_movements_count ?? null) : null,
        stool: s ? (s.stool_consistency ?? null) : null,
        meals: dayMeals,
        reactionLevel,
      });
    }

    // suspicious foods: meals with moderate/severe reaction or not tolerated,
    // followed (same/next day) by elevated symptoms
    const susp = new Map();
    const elevated = (sym) => sym && (
      (sym.pain_level ?? 0) >= 5 ||
      (sym.fatigue_level ?? 0) >= 5 ||
      (sym.bowel_movements_count ?? 0) >= 5 ||
      sym.blood
    );
    const cutoff = rangeDays ? keyOf(new Date(new Date(start).setDate(start.getDate() - 1))) : null;
    foods.forEach((f) => {
      if (!f.entry_date) return;
      if (cutoff && f.entry_date < cutoff) return;
      const sev = SEVERITY[f.reaction] || 0;
      if (sev < 2 && f.tolerated !== false) return;
      const d = new Date(f.entry_date + 'T00:00:00');
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const keys = [keyOf(d), keyOf(next)];
      if (!keys.some((k) => elevated(symMap.get(k)))) return;
      String(f.foods || '')
        .split(/[\n,;·•]+/)
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((item) => susp.set(item, (susp.get(item) || 0) + 1));
    });
    return { series: days, suspicious: Array.from(susp.entries()).sort((a, b) => b[1] - a[1]) };
  }, [entries, foods, rangeDays]);

  const avg = (field) => {
    const vals = series.map((s) => s[field]).filter((v) => v !== null && v !== undefined);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const trendOf = (field) => {
    const vals = series.map((s) => s[field]).filter((v) => v !== null && v !== undefined);
    if (vals.length < 4) return 'stable';
    const half = Math.floor(vals.length / 2);
    const firstAvg = vals.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const lastAvg = vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half);
    const diff = lastAvg - firstAvg;
    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'worsening' : 'improving';
  };

  const TrendBadge = ({ field }) => {
    const dir = trendOf(field);
    const label = dir === 'improving' ? t('trends.improving') : dir === 'worsening' ? t('trends.worsening') : t('trends.stable');
    const Icon = dir === 'improving' ? TrendingDown : dir === 'worsening' ? TrendingUp : Minus;
    const color = dir === 'improving' ? 'text-emerald-600' : dir === 'worsening' ? 'text-destructive' : 'text-muted-foreground';
    return (
      <span className={cn('inline-flex items-center gap-1 text-sm', color)}>
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  const hasData = series.some((s) => s.pain !== null || s.fatigue !== null || s.bowel !== null);
  const charts = [
    { field: 'pain', label: t('trends.pain'), color: 'hsl(8 70% 58%)', max: 10 },
    { field: 'fatigue', label: t('trends.fatigue'), color: 'hsl(43 74% 50%)', max: 10 },
    { field: 'bowel', label: t('trends.bowel'), color: 'hsl(174 40% 34%)', max: undefined },
  ];

  const isFreeView = rangeKey === FREE_RANGE_KEY;

  return (
    <div>
      <PageHeader title={t('trends.title')} subtitle={t('trends.subtitle')} />
      <PageEditorial pageKey="trends" />
      {!isAuthenticated && <DemoBanner />}
      <MagazineEssay theme="alimentazione" number="01" eyebrow={t('trends.eyebrow')} title={t('trends.charts_title')}>
      <Link to="/symptom-charts" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4">
        <BarChart3 className="w-4 h-4" /> {t('symptom_charts.title')} →
      </Link>

      <ChartRangeSelector value={rangeKey} onChange={setRangeKey} feature="trends_range" />

      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setOverlay((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            overlay ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
          )}
        >
          <Utensils className="w-4 h-4" />
          {t('trends.overlay')}
        </button>
        <div className="flex items-center gap-2">
          {isFreeView && isExpired && <ReadonlyBadge />}
          <DoctorSummaryExport range={rangeDays ?? 90} />
        </div>
      </div>

      {overlay && (
        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full border-2 border-orange-500" />
          {t('trends.hint')}
        </p>
      )}

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : !hasData ? (
        <EmptyState icon={TrendingUp} title={t('trends.no_data')} />
      ) : (
        <div className="space-y-5">
          <div className="grid md:grid-cols-3 gap-4">
            {charts.map((c) => {
              const a = avg(c.field);
              return (
                <Card key={c.field}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-muted-foreground">{c.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-semibold text-foreground">{a !== null ? a.toFixed(1) : '—'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('trends.avg')}</p>
                      </div>
                      <TrendBadge field={c.field} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {charts.map((c) => (
            <Card key={c.field}>
              <CardHeader className="pb-1">
                <CardTitle className="text-lg">{c.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" minTickGap={20} />
                      <YAxis domain={c.max ? [0, c.max] : [0, 'auto']} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                      <Tooltip
                        content={<TrendsTooltip field={c.field} color={c.color} label={c.label} t={t} overlay={overlay} />}
                      />
                      <Line
                        type="monotone"
                        dataKey={c.field}
                        stroke={c.color}
                        strokeWidth={3}
                        connectNulls
                        dot={overlay ? (p) => {
                          const lvl = p.payload.reactionLevel;
                          if (!lvl) return <circle key={p.index} cx={p.cx} cy={p.cy} r={2.5} fill={c.color} />;
                          return (
                            <g key={p.index}>
                              <circle cx={p.cx} cy={p.cy} r={5} fill="none" stroke={SEV_COLOR[lvl]} strokeWidth={2} />
                              <circle cx={p.cx} cy={p.cy} r={2.5} fill={c.color} />
                            </g>
                          );
                        } : { r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}

          <MealSpikes series={series} />

          <DiseaseCourse entries={entries} range={rangeDays ?? 365} />

          {overlay && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  {t('trends.suspicious')}
                </CardTitle>
                <CardDescription>{t('trends.suspicious_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {suspicious.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('trends.none_suspicious')}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {suspicious.slice(0, 16).map(([item, count]) => (
                      <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-sm border border-rose-200">
                        {item}
                        <span className="text-xs font-semibold bg-rose-200/60 text-rose-800 rounded-full px-1.5 py-0.5">{count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      </MagazineEssay>
      <EditorialBlock sectionKey="trends_triggers" align="right" />
    </div>
  );
}