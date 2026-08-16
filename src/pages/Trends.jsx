import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Utensils, AlertTriangle, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import MealSpikes from '@/components/MealSpikes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RANGES = [
  { days: 7, key: 'range1' },
  { days: 14, key: 'range2' },
  { days: 28, key: 'range4' },
];

const SEVERITY = { nessuna: 0, lieve: 1, moderata: 2, severa: 3 };
const SEV_COLOR = { 1: '#f59e0b', 2: '#f97316', 3: '#ef4444' };
const R_TONE = { nessuna: 'text-emerald-600', lieve: 'text-amber-600', moderata: 'text-orange-600', severa: 'text-rose-500' };

function fmtDay(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
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
  const [entries, setEntries] = useState(null);
  const [foods, setFoods] = useState([]);
  const [range, setRange] = useState(28);
  const [loading, setLoading] = useState(true);
  const [overlay, setOverlay] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [symp, food] = await Promise.all([
          base44.entities.SymptomEntry.list('-entry_date', 500),
          base44.entities.FoodEntry.list('-entry_date', 500),
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

    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
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
    const cutoff = keyOf(addDays(today, -range));
    foods.forEach((f) => {
      if (!f.entry_date || f.entry_date < cutoff) return;
      const sev = SEVERITY[f.reaction] || 0;
      if (sev < 2 && f.tolerated !== false) return;
      const d = new Date(f.entry_date + 'T00:00:00');
      const keys = [keyOf(d), keyOf(addDays(d, 1))];
      if (!keys.some((k) => elevated(symMap.get(k)))) return;
      String(f.foods || '')
        .split(/[\n,;·•]+/)
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((item) => susp.set(item, (susp.get(item) || 0) + 1));
    });
    return { series: days, suspicious: Array.from(susp.entries()).sort((a, b) => b[1] - a[1]) };
  }, [entries, foods, range]);

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

  return (
    <div>
      <PageHeader title={t('trends.title')} subtitle={t('trends.subtitle')} />

      <Link to="/symptom-charts" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4">
        <BarChart3 className="w-4 h-4" /> {t('symptom_charts.title')} →
      </Link>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setRange(r.days)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              range === r.days ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
            )}
          >
            {t('trends.' + r.key)}
          </button>
        ))}
        <button
          onClick={() => setOverlay((v) => !v)}
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            overlay ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
          )}
        >
          <Utensils className="w-4 h-4" />
          {t('trends.overlay')}
        </button>
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
    </div>
  );
}