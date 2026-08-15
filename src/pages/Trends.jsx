import React, { useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const RANGES = [
  { days: 7, key: 'range1' },
  { days: 14, key: 'range2' },
  { days: 28, key: 'range4' },
];

function fmtDay(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Trends() {
  const { t } = useI18n();
  const [entries, setEntries] = React.useState(null);
  const [range, setRange] = React.useState(28);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await base44.entities.SymptomEntry.list('-entry_date', 500);
        if (alive) setEntries(data);
      } catch (e) {
        if (alive) setEntries([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const series = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const byDate = new Map();
    entries.forEach((e) => {
      if (!e.entry_date) return;
      const d = new Date(e.entry_date + 'T00:00:00');
      const key = e.entry_date;
      const prev = byDate.get(key);
      // keep the most recently created entry for that date
      if (!prev || (e.created_date || '') > (prev.created_date || '')) {
        byDate.set(key, { ...e, _date: d });
      }
    });
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const matched = Array.from(byDate.values()).find((v) => sameDay(v._date, d));
      days.push({
        date: fmtDay(d),
        pain: matched ? (matched.pain_level ?? null) : null,
        fatigue: matched ? (matched.fatigue_level ?? null) : null,
        bowel: matched ? (matched.bowel_movements_count ?? null) : null,
        stool: matched ? (matched.stool_consistency ?? null) : null,
      });
    }
    return days;
  }, [entries, range]);

  const avg = (field) => {
    const vals = series.map((s) => s[field]).filter((v) => v !== null && v !== undefined);
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  // trend: compare average of first half vs second half
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
      <PageHeader
        title={t('trends.title')}
        subtitle={t('trends.subtitle')}
      />

      {/* Range selector */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
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
      </div>

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
                        <p className="text-3xl font-semibold text-foreground">
                          {a !== null ? a.toFixed(1) : '—'}
                        </p>
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
                      <YAxis
                        domain={c.max ? [0, c.max] : [0, 'auto']}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '0.75rem',
                          border: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--card))',
                          fontSize: '13px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line
                        type="monotone"
                        dataKey={c.field}
                        stroke={c.color}
                        strokeWidth={3}
                        dot={{ r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}