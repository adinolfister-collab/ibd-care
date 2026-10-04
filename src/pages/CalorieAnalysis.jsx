import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import { Flame, Scale, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import GoogleFitConnectButton from '@/components/googlefit/GoogleFitConnectButton';
import WeightTracker from '@/components/food/WeightTracker';

const RANGES = [
  { key: '7', days: 7 },
  { key: '30', days: 30 },
  { key: '90', days: 90 },
];

function cutoffForDays(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

function formatDateShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function CalorieAnalysis() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [foods, setFoods] = useState([]);
  const [activities, setActivities] = useState([]);
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState('7');

  const range = RANGES.find((r) => r.key === rangeKey);
  const cutoff = useMemo(() => cutoffForDays(range.days), [range]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!isAuthenticated) { setLoading(false); return; }
      try {
        const [f, a, w] = await Promise.all([
          base44.entities.FoodEntry.list('-entry_date', 1000),
          base44.entities.ActivityEntry.list('-entry_date', 1000),
          base44.entities.WeightEntry.list('-entry_date', 1000),
        ]);
        if (cancelled) return;
        setFoods(f);
        setActivities(a);
        setWeights(w);
      } catch { if (!cancelled) { setFoods([]); setActivities([]); setWeights([]); } }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const dailyData = useMemo(() => {
    const map = {};
    for (const meal of foods) {
      if ((meal.entry_date || '') < cutoff) continue;
      const items = Array.isArray(meal.items) ? meal.items : [];
      const kcal = items.reduce((s, it) => s + (Number(it.kcal) || 0), 0);
      if (!map[meal.entry_date]) map[meal.entry_date] = { date: meal.entry_date, consumed: 0, burned: 0, steps: 0 };
      map[meal.entry_date].consumed += Math.round(kcal);
    }
    for (const a of activities) {
      if ((a.entry_date || '') < cutoff) continue;
      if (!map[a.entry_date]) map[a.entry_date] = { date: a.entry_date, consumed: 0, burned: 0, steps: 0 };
      map[a.entry_date].burned += a.kcal_expended || 0;
      map[a.entry_date].steps += a.steps || 0;
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({
      ...d,
      label: formatDateShort(d.date),
      balance: d.consumed - d.burned,
    }));
  }, [foods, activities, cutoff]);

  const weightData = useMemo(() => {
    return weights
      .filter((w) => (w.entry_date || '') >= cutoff)
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
      .map((w) => ({ date: w.entry_date, weight: w.weight_kg, label: formatDateShort(w.entry_date), source: w.source }));
  }, [weights, cutoff]);

  const avgConsumed = dailyData.length ? Math.round(dailyData.reduce((s, d) => s + d.consumed, 0) / dailyData.length) : 0;
  const avgBurned = dailyData.length ? Math.round(dailyData.reduce((s, d) => s + d.burned, 0) / dailyData.length) : 0;
  const avgSteps = dailyData.length ? Math.round(dailyData.reduce((s, d) => s + d.steps, 0) / dailyData.length) : 0;
  const hasData = dailyData.length > 0 || weightData.length > 0;

  return (
    <AppLayout>
      <PageHeader title={t('calorie.title')} subtitle={t('calorie.subtitle')} />
      <PageEditorial pageKey="calorie-analysis" />

      {!isAuthenticated ? (
        <EmptyState icon={Flame} title={t('calorie.no_data')} description={t('calorie.no_data_desc')} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex gap-1.5">
              {RANGES.map((r) => (
                <Button
                  key={r.key}
                  variant={rangeKey === r.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRangeKey(r.key)}
                  className="rounded-xl"
                >
                  {t(`calorie.range_${r.key}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-6 md:space-y-8">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-card border border-border p-3 text-center">
                <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{t('calorie.consumed')}</p>
                <p className="text-lg font-bold text-terracotta">{avgConsumed}</p>
                <p className="text-[0.6rem] text-muted-foreground">kcal/giorno</p>
              </div>
              <div className="rounded-xl bg-card border border-border p-3 text-center">
                <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{t('calorie.burned')}</p>
                <p className="text-lg font-bold text-chart-2">{avgBurned}</p>
                <p className="text-[0.6rem] text-muted-foreground">kcal/giorno</p>
              </div>
              <div className="rounded-xl bg-card border border-border p-3 text-center">
                <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{t('calorie.steps')}</p>
                <p className="text-lg font-bold text-chart-4">{avgSteps.toLocaleString()}</p>
                <p className="text-[0.6rem] text-muted-foreground">/giorno</p>
              </div>
            </div>

            <GoogleFitConnectButton />
            <WeightTracker />

            {loading ? (
              <p className="text-muted-foreground">{t('common.loading')}</p>
            ) : !hasData ? (
              <EmptyState icon={TrendingDown} title={t('calorie.no_data')} description={t('calorie.no_data_desc')} />
            ) : (
              <>
                {/* Balance chart */}
                {dailyData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Flame className="w-5 h-5 text-terracotta" />
                        {t('calorie.balance_chart_title')}
                      </CardTitle>
                      <CardDescription>{t('calorie.balance_chart_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyData} margin={{ left: 0, right: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip
                              contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', fontSize: 12 }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="consumed" name={t('calorie.consumed')} fill="hsl(var(--terracotta))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="burned" name={t('calorie.burned')} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Weight chart */}
                {weightData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Scale className="w-5 h-5 text-chart-3" />
                        {t('calorie.weight_chart_title')}
                      </CardTitle>
                      <CardDescription>{t('calorie.weight_chart_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 md:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weightData} margin={{ left: 0, right: 16 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip
                              contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', fontSize: 12 }}
                            />
                            <Line type="monotone" dataKey="weight" name={t('weight.kg')} stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}