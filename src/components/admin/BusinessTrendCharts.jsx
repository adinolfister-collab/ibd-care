import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const RANGES = [
  { value: '30', label: '30 gg' },
  { value: '90', label: '90 gg' },
  { value: '365', label: '1 anno' },
];

// Grafici di andamento dagli snapshot storici. Priorita': % uso Cary per
// modalita' (premium, trial, demo) nel tempo.
export default function BusinessTrendCharts({ snapshots, range, onRangeChange }) {
  const data = useMemo(() => {
    const days = Number(range);
    const cutoff = Date.now() - days * 86400000;
    return (snapshots || [])
      .filter((s) => new Date(s.snapshot_date).getTime() >= cutoff)
      .slice()
      .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
      .map((s) => ({
        date: s.snapshot_date.slice(5),
        premium: s.cary_usage_premium_pct || 0,
        trial: s.cary_usage_trial_pct || 0,
        demo: s.cary_usage_demo_pct || 0,
        premium_users: s.premium_users || 0,
        trial_users: s.trial_users || 0,
        demo_users: s.demo_users || 0,
        revenue: s.estimated_monthly_revenue || 0,
        cost: s.estimated_monthly_cost || 0,
        margin: s.estimated_margin || 0,
      }));
  }, [snapshots, range]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Andamento temporale</h2>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => onRangeChange(r.value)}
              className={cn(
                'px-3 py-1 rounded-full text-xs border transition-colors',
                range === r.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nessuno snapshot archiviato nel periodo. Usa "Salva snapshot ora" per crearne uno o attendi il workflow giornaliero.
          </CardContent>
        </Card>
      ) : (
        <>
          <ChartCard title="% uso Cary per modalità" subtitle="Adozione Cary nel tempo (premium · trial · demo)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="premium" name="Premium" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="trial" name="Trial" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="demo" name="Demo" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Utenti nel tempo" subtitle="Premium · Trial · Demo">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="premium_users" name="Premium" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="trial_users" name="Trial" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="demo_users" name="Demo" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Ricavi · Costi · Margine" subtitle="$ / mese stimati">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Ricavi" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="Costi" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="margin" name="Margine" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
        {children}
      </CardContent>
    </Card>
  );
}