import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

// Sezione adozione Cary: per ogni modalità (premium, trial, demo) mostra il
// numero assoluto di utenti Cary / totale e la % reale, con uno slider what-if
// per simulare percentuali di adozione diverse. Gli admin sono esclusi dal
// conteggio lato backend, quindi qui mostriamo solo utenti reali.
export default function BusinessCaryAdoption({ live, sim, onSimChange, onReset, windowDays }) {
  const tiers = [
    { key: 'premium', label: 'Premium', color: 'text-emerald-600', total: live?.premium_users || 0, cary: live?.premium_cary_users || 0, livePct: live?.cary_usage_premium_pct || 0 },
    { key: 'trial', label: 'Trial', color: 'text-amber-600', total: live?.trial_users || 0, cary: live?.trial_cary_users || 0, livePct: live?.cary_usage_trial_pct || 0 },
    { key: 'demo', label: 'Demo', color: 'text-sky-600', total: live?.demo_users || 0, cary: live?.demo_cary_users || 0, livePct: live?.cary_usage_demo_pct || 0 },
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <h2 className="font-heading text-lg font-semibold mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-terracotta" />
          Adozione Cary
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Utenti che hanno usato Cary negli ultimi {windowDays} giorni. Gli admin sono esclusi dal conteggio.
        </p>

        <div className="space-y-5">
          {tiers.map((t) => {
            const simPct = sim[t.key];
            const useSim = simPct !== null && simPct !== undefined;
            const pct = useSim ? simPct : t.livePct;
            const absCary = useSim ? Math.round((t.total * pct) / 100) : t.cary;
            const isOverride = useSim && simPct !== t.livePct;
            return (
              <div key={t.key}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    <span className="font-semibold text-foreground">{absCary}</span>
                    <span className="mx-0.5">/</span>{t.total} utenti
                    <span className="ml-1.5 font-semibold">{pct}%</span>
                    {isOverride && <span className="ml-1.5 text-terracotta">simulato</span>}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="0" max="100" step="1"
                    value={pct}
                    onChange={(e) => onSimChange(t.key, Number(e.target.value))}
                    className="flex-1 accent-terracotta"
                  />
                  {useSim && (
                    <button onClick={() => onReset(t.key)} className="text-xs text-terracotta underline whitespace-nowrap">
                      reset
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[0.65rem] text-muted-foreground mt-4">
          Solo premium e trial consumano crediti Base44. La modalità demo usa risposte simulate lato client (nessun credito).
        </p>
      </CardContent>
    </Card>
  );
}