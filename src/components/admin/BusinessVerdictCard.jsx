import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Target, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Card verdetto costi-benefici con semaforo (verde/amber/rosso).
export default function BusinessVerdictCard({ proj, plan, premiumPrice, premiumUsers }) {
  const verdict = proj.verdict;
  const cfg = {
    profit: { label: 'In utile', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'ring-emerald-200 dark:ring-emerald-500/30', Icon: CheckCircle2 },
    warning: { label: 'Zona di attenzione', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', ring: 'ring-amber-200 dark:ring-amber-500/30', Icon: AlertTriangle },
    loss: { label: 'In perdita', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10', ring: 'ring-rose-200 dark:ring-rose-500/30', Icon: TrendingDown },
  }[verdict];

  const marginPos = proj.margin >= 0;
  const fmtMoney = (n) => (n || 0).toLocaleString('it-IT', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  return (
    <Card className={cn('border-0 shadow-sm ring-1', cfg.ring)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Verdetto costi-benefici</p>
            <div className={cn('inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-sm font-semibold', cfg.bg, cfg.color)}>
              <cfg.Icon className="w-4 h-4" />
              {cfg.label}
            </div>
          </div>
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', cfg.bg)}>
            <cfg.Icon className={cn('w-6 h-6', cfg.color)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Ricavi stimati /mese</p>
            <p className="text-xl font-heading font-semibold">{fmtMoney(proj.revenue)}</p>
            <p className="text-[0.65rem] text-muted-foreground">{premiumUsers} premium × {fmtMoney(premiumPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Costo piano /mese</p>
            <p className="text-xl font-heading font-semibold">{fmtMoney(proj.cost)}</p>
            <p className="text-[0.65rem] text-muted-foreground">{plan.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Margine netto /mese</p>
            <p className={cn('text-xl font-heading font-semibold', marginPos ? 'text-emerald-600' : 'text-rose-600')}>
              {marginPos ? '+' : ''}{fmtMoney(proj.margin)}
            </p>
            <p className="text-[0.65rem] text-muted-foreground">{proj.marginPct}% sul costo</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Break-even utenti</p>
            <p className="text-xl font-heading font-semibold flex items-center gap-1">
              <Target className="w-4 h-4 text-terracotta" />
              {proj.breakEvenUsers ?? '—'}
            </p>
            <p className="text-[0.65rem] text-muted-foreground">premium per coprire i costi</p>
          </div>
        </div>

        <div className="space-y-2">
          <CreditBar label="Crediti messaggi" used={proj.msgCreditsUsed} total={plan.msgCredits} pct={proj.msgCreditsPct} />
          <CreditBar label="Crediti integrazione" used={proj.integrationCreditsUsed} total={plan.integrationCredits} pct={proj.integrationCreditsPct} />
        </div>
      </CardContent>
    </Card>
  );
}

function CreditBar({ label, used, total, pct }) {
  const safePct = Math.min(100, Math.max(0, pct));
  const tone = safePct >= 90 ? 'bg-rose-500' : safePct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{used.toLocaleString('it-IT')} / {total.toLocaleString('it-IT')} ({safePct}%)</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${safePct}%` }} />
      </div>
    </div>
  );
}