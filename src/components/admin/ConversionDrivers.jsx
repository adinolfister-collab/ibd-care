import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Driver di conversione: quali feature usano maggiormente gli utenti che
// poi si abbonano, con tasso di conversione e "lift" rispetto al baseline.
export default function ConversionDrivers({ drivers, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5 h-40 animate-pulse" />
      </Card>
    );
  }

  const list = drivers || [];
  const maxRate = Math.max(1, ...list.map((d) => d.conversionRate));

  return (
    <Card className="border-0 shadow-sm mb-6">
      <CardContent className="p-5">
        <h2 className="font-heading text-lg font-semibold mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-terracotta" />
          Driver di conversione
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Quanto si abbona chi usa ciascuna feature. "Lift" = quante volte rispetto alla media.
        </p>

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Dati insufficienti: servono utenti autenticati con eventi di utilizzo feature.
          </p>
        ) : (
          <div className="space-y-2.5">
            {list.map((d) => (
              <div key={d.feature} className="flex items-center gap-3">
                <div className="w-28 shrink-0">
                  <p className="text-sm font-medium capitalize truncate">{d.feature}</p>
                  <p className="text-[0.65rem] text-muted-foreground">{d.totalUsers} utenti</p>
                </div>
                <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-terracotta/70 rounded-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${Math.max(8, (d.conversionRate / maxRate) * 100)}%` }}
                  >
                    <span className="text-[0.65rem] font-medium text-white">{d.conversionRate}%</span>
                  </div>
                </div>
                <div className="w-20 shrink-0 text-right">
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-xs font-medium',
                      d.lift >= 1.5 ? 'text-emerald-600' : d.lift >= 1 ? 'text-amber-600' : 'text-muted-foreground',
                    )}
                  >
                    {d.lift >= 1 && <TrendingUp className="w-3 h-3" />}
                    {d.lift}×
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}