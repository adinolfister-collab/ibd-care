import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Activity, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { computeFoodCorrelation, buildSymptomMap } from '@/lib/correlationStats';
import { computeTriggerLights } from '@/lib/triggerLight';
import TriggerLightBadge from '@/components/TriggerLightBadge';
import CookingCorrelation from '@/components/CookingCorrelation';
import ChartRangeSelector from '@/components/ChartRangeSelector';
import ReadonlyBadge from '@/components/ReadonlyBadge';
import { useSubscription } from '@/hooks/useSubscription';
import { getRange, DEFAULT_RANGE_KEY, FREE_RANGE_KEY, cutoffDateForRange, listLimitForRange } from '@/lib/chartRanges';

const TOP = 12;

export default function Correlazioni() {
  const { t, lang } = useI18n();
  const { isSubscribed } = useSubscription();
  const [foods, setFoods] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState(DEFAULT_RANGE_KEY);

  const range = getRange(rangeKey);
  const cutoff = useMemo(() => cutoffDateForRange(range), [range]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
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

  const stats = useMemo(() => {
    const symMap = buildSymptomMap(entries);
    return computeFoodCorrelation(foods, symMap, 1);
  }, [foods, entries]);

  const triggerLights = useMemo(() => computeTriggerLights(foods, entries), [foods, entries]);
  const triggerItems = useMemo(() => Array.from(triggerLights.entries())
    .filter(([, v]) => v.occurrences >= 3)
    .sort((a, b) => {
      const order = { red: 0, yellow: 1, green: 2 };
      return order[a[1].status] - order[b[1].status] || b[1].occurrences - a[1].occurrences;
    }), [triggerLights]);

  const bowelData = useMemo(
    () => stats.filter((s) => s.count > 0).sort((a, b) => b.avgBowel - a.avgBowel).slice(0, TOP),
    [stats]
  );
  const painData = useMemo(
    () => stats.filter((s) => s.avgPain != null).sort((a, b) => b.avgPain - a.avgPain).slice(0, TOP),
    [stats]
  );

  return (
    <AppLayout>
      <PageHeader
        title={t('correlazioni.title')}
        subtitle={t('correlazioni.subtitle')}
      />
      <PageEditorial pageKey="correlazioni" />

      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <ChartRangeSelector value={rangeKey} onChange={setRangeKey} feature="correlazioni_range" className="mb-0" />
        {rangeKey === FREE_RANGE_KEY && !isSubscribed && <ReadonlyBadge />}
      </div>

      <div className="space-y-6 md:space-y-8">
        {!loading && triggerItems.length > 0 && (
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

        {!loading && foods.length > 0 && (
          <CookingCorrelation foods={foods} />
        )}
        {loading ? (
          <p className="text-muted-foreground">{t('common.loading')}</p>
        ) : bowelData.length === 0 && painData.length === 0 ? (
          <EmptyState
            icon={TrendingDown}
            title={t('correlazioni.empty')}
            description={t('correlazioni.empty_desc')}
          />
        ) : (
          <>
            {/* Cibi vs n° scariche */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-chart-2" />
                  {t('correlazioni.bowel_title')}
                </CardTitle>
                <CardDescription>
                  {t('correlazioni.bowel_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bowelData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('correlazioni.no_data')}</p>
                ) : (
                  <div className="h-72 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bowelData} layout="vertical" margin={{ left: 8, right: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis
                          type="category"
                          dataKey="item"
                          width={110}
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--accent))' }}
                          contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', fontSize: 12 }}
                        />
                        <Bar dataKey="avgBowel" name={t('symptoms.bowel')} fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cibi vs livello dolore */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-chart-1" />
                  {t('correlazioni.pain_title')}
                </CardTitle>
                <CardDescription>
                  {t('correlazioni.pain_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {painData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('correlazioni.no_data')}</p>
                ) : (
                  <div className="h-72 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={painData} layout="vertical" margin={{ left: 8, right: 24 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis
                          type="category"
                          dataKey="item"
                          width={110}
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--accent))' }}
                          contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', fontSize: 12 }}
                        />
                        <Bar dataKey="avgPain" name={t('symptoms.pain')} fill="hsl(var(--chart-1))" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}