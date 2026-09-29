import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart, BarChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { CalendarRange, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EmptyState from '@/components/EmptyState';
import DemoBanner from '@/components/DemoBanner';
import ReadonlyBadge from '@/components/ReadonlyBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { demoSymptoms } from '@/lib/demoData';
import { cn } from '@/lib/utils';

const PAIN_COLOR = 'hsl(8 70% 58%)';
const BOWEL_COLOR = 'hsl(173 58% 39%)';

function monthKey(dateStr) {
  return (dateStr || '').slice(0, 7); // YYYY-MM
}

function monthLabel(ym) {
  const [y, m] = ym.split('-');
  return `${m}/${y.slice(2)}`;
}

export default function TrendMensili() {
  const { t } = useI18n();
  const { isExpired } = useSubscription();
  const { isAuthenticated } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!isAuthenticated) {
        setEntries(demoSymptoms);
        setLoading(false);
        return;
      }
      try {
        const list = await base44.entities.SymptomEntry.list('-entry_date', 500);
        if (!cancelled) setEntries(list);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Monthly aggregation
  const monthly = useMemo(() => {
    const buckets = new Map();
    entries.forEach((e) => {
      const ym = monthKey(e.entry_date);
      if (!ym || ym.length < 7) return;
      if (!buckets.has(ym)) buckets.set(ym, { pain: [], bowel: [] });
      const b = buckets.get(ym);
      if (e.pain_level != null) b.pain.push(e.pain_level);
      if (e.bowel_movements_count != null) b.bowel.push(e.bowel_movements_count);
    });
    const sorted = Array.from(buckets.keys()).sort();
    return sorted.map((ym) => {
      const b = buckets.get(ym);
      const avg = (arr) => (arr.length ? arr.reduce((a, c) => a + c, 0) / arr.length : null);
      return {
        month: monthLabel(ym),
        ym,
        pain: avg(b.pain),
        bowel: avg(b.bowel),
        painCount: b.pain.length,
        bowelCount: b.bowel.length,
      };
    });
  }, [entries]);

  // Improvement: first 3 months vs last 3 months
  const improvement = useMemo(() => {
    if (monthly.length < 2) return null;
    const firstN = (n) => monthly.slice(0, n);
    const lastN = (n) => monthly.slice(Math.max(0, monthly.length - n));
    const avgField = (slice, field) => {
      const vals = slice.map((m) => m[field]).filter((v) => v !== null);
      if (!vals.length) return null;
      return vals.reduce((a, c) => a + c, 0) / vals.length;
    };
    const firstSlice = firstN(Math.min(3, monthly.length - 1));
    const lastSlice = lastN(Math.min(3, monthly.length - 1));
    return {
      firstPain: avgField(firstSlice, 'pain'),
      lastPain: avgField(lastSlice, 'pain'),
      firstBowel: avgField(firstSlice, 'bowel'),
      lastBowel: avgField(lastSlice, 'bowel'),
      months: monthly.length,
    };
  }, [monthly]);

  const hasData = monthly.some((m) => m.pain !== null || m.bowel !== null);

  const deltaBadge = (first, last, lowerIsBetter = false) => {
    if (first == null || last == null) return null;
    const diff = last - first;
    const pct = first !== 0 ? Math.round((diff / first) * 100) : 0;
    const improved = lowerIsBetter ? diff < -0.3 : diff > 0.3;
    const worsened = lowerIsBetter ? diff > 0.3 : diff < -0.3;
    const Icon = improved ? TrendingDown : worsened ? TrendingUp : Minus;
    const color = improved ? 'text-emerald-600' : worsened ? 'text-destructive' : 'text-muted-foreground';
    const sign = diff >= 0 ? '+' : '';
    return (
      <span className={cn('inline-flex items-center gap-1 text-sm font-medium', color)}>
        <Icon className="w-4 h-4" />
        {sign}{diff.toFixed(1)} ({sign}{pct}%)
      </span>
    );
  };

  const TooltipBox = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0].payload;
    return (
      <div className="rounded-xl border border-border bg-card shadow-md p-3" style={{ minWidth: 160 }}>
        <p className="font-semibold text-sm mb-1.5">{label}</p>
        {p.pain !== null && (
          <p className="text-sm" style={{ color: PAIN_COLOR }}>
            {t('symptom_charts.pain')}: <span className="font-medium">{p.pain.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground ml-1">({p.painCount})</span>
          </p>
        )}
        {p.bowel !== null && (
          <p className="text-sm" style={{ color: BOWEL_COLOR }}>
            {t('symptoms.bowel')}: <span className="font-medium">{p.bowel.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground ml-1">({p.bowelCount})</span>
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
      <PageHeader title={t('trend_mensili.title')} subtitle={t('trend_mensili.subtitle')} />
      <PageEditorial pageKey="trend_mensili" />
      {!isAuthenticated && <DemoBanner />}

      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <p className="text-sm text-muted-foreground">{t('trend_mensili.range_hint')}</p>
        {isExpired && <ReadonlyBadge />}
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : !hasData ? (
        <EmptyState icon={CalendarRange} title={t('trend_mensili.no_data')} description={t('trend_mensili.no_data_desc')} />
      ) : (
        <div className="space-y-6 md:space-y-8">
          {/* Summary cards */}
          {improvement && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t('trend_mensili.pain_trend')}</p>
                  <div className="flex items-end justify-between mt-1.5 gap-2">
                    <div>
                      <p className="text-2xl font-semibold">
                        {improvement.lastPain !== null ? improvement.lastPain.toFixed(1) : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('trend_mensili.from')} {improvement.firstPain !== null ? improvement.firstPain.toFixed(1) : '—'}
                      </p>
                    </div>
                    {deltaBadge(improvement.firstPain, improvement.lastPain, true)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t('trend_mensili.bowel_trend')}</p>
                  <div className="flex items-end justify-between mt-1.5 gap-2">
                    <div>
                      <p className="text-2xl font-semibold">
                        {improvement.lastBowel !== null ? improvement.lastBowel.toFixed(1) : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('trend_mensili.from')} {improvement.firstBowel !== null ? improvement.firstBowel.toFixed(1) : '—'}
                      </p>
                    </div>
                    {deltaBadge(improvement.firstBowel, improvement.lastBowel, true)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{t('trend_mensili.months_tracked')}</p>
                  <p className="text-2xl font-semibold mt-1.5">{improvement.months}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monthly pain trend */}
          {monthly.some((m) => m.pain !== null) && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-chart-1" />
                  {t('trend_mensili.pain_chart')}
                </CardTitle>
                <CardDescription>{t('trend_mensili.pain_chart_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthly} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" minTickGap={15} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                      <Tooltip content={<TooltipBox />} />
                      <Line type="monotone" dataKey="pain" name={t('symptom_charts.pain')} stroke={PAIN_COLOR} strokeWidth={3} connectNulls dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly bowel trend */}
          {monthly.some((m) => m.bowel !== null) && (
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-chart-2" />
                  {t('trend_mensili.bowel_chart')}
                </CardTitle>
                <CardDescription>{t('trend_mensili.bowel_chart_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 md:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthly} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" minTickGap={15} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                      <Tooltip content={<TooltipBox />} cursor={{ fill: 'hsl(var(--accent))' }} />
                      <Bar dataKey="bowel" name={t('symptoms.bowel')} fill={BOWEL_COLOR} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AppLayout>
  );
}