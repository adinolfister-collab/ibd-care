import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

// Riga di KPI vs target di marketing (login / registrazioni / conversioni).
const STATUS = {
  reached: { label: 'Raggiunto', badge: 'bg-emerald-100 text-emerald-700' },
  'on-track': { label: 'In pista', badge: 'bg-amber-100 text-amber-700' },
  behind: { label: 'Indietro', badge: 'bg-rose-100 text-rose-700' },
};

export default function GrowthKpiCard({ kpis, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="border-0 shadow-sm animate-pulse">
            <CardContent className="p-5 h-28" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {kpis.map((k) => {
        const st = STATUS[k.status] || STATUS.behind;
        const up = k.deltaPct > 0;
        const down = k.deltaPct < 0;
        const pct = Math.min(100, k.target > 0 ? Math.round((k.current / k.target) * 100) : 0);
        return (
          <Card key={k.key} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground leading-tight">{k.label}</p>
                <span className={cn('text-[0.6rem] font-medium px-2 py-0.5 rounded-full', st.badge)}>
                  {st.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-heading font-semibold tabular-nums">{k.current}</p>
                <span className="text-xs text-muted-foreground">/ {k.target}{k.unit}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs">
                {up && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
                {down && <TrendingDown className="w-3.5 h-3.5 text-rose-600" />}
                {!up && !down && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
                <span className={cn(up && 'text-emerald-600', down && 'text-rose-600', !up && !down && 'text-muted-foreground')}>
                  {up ? '+' : ''}{k.deltaPct}% vs settimana scorsa
                </span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-terracotta rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center gap-1 mt-2 text-[0.65rem] text-muted-foreground">
                <Target className="w-3 h-3" />
                Target: {k.target}{k.unit}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}