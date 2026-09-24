import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const METHODS = ['al_vapore', 'bollito', 'al_forno', 'piastrato', 'fritto', 'crudo'];
const REACTED = new Set(['lieve', 'moderata', 'severa']);
const MIN_MEALS = 3;

// Correlazione per metodo di cottura: per ogni metodo, percentuale di pasti
// con reazione (lieve/moderata/severa) e badge tollerato/da evitare dove i
// dati sono significativi (>=3 pasti). Analisi pura su FoodEntry esistenti.
export default function CookingCorrelation({ foods }) {
  const { t } = useI18n();

  const rows = useMemo(() => {
    return METHODS.map((m) => {
      const meals = (foods || []).filter((f) => f.cooking_method === m);
      const total = meals.length;
      const reacted = meals.filter((f) => REACTED.has(f.reaction)).length;
      const rate = total ? Math.round((reacted / total) * 100) : null;
      let status = 'neutral';
      if (total >= MIN_MEALS) {
        if (rate >= 50) status = 'avoid';
        else if (rate <= 20) status = 'ok';
      }
      return { method: m, total, reacted, rate, status };
    }).filter((r) => r.total > 0);
  }, [foods]);

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-terracotta" />
          {t('food.cooking_corr_title')}
        </CardTitle>
        <CardDescription>{t('food.cooking_corr_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.method} className="rounded-xl border border-border p-3 bg-muted/20">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-medium text-sm capitalize">{t(`food.cooking_${r.method}`)}</span>
                {r.status === 'ok' && (
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t('food.cooking_ok')}</span>
                )}
                {r.status === 'avoid' && (
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wide bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{t('food.cooking_avoid')}</span>
                )}
                {r.status === 'neutral' && r.total < MIN_MEALS && (
                  <span className="text-[0.65rem] text-muted-foreground">{t('food.cooking_few')}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', r.rate >= 50 ? 'bg-rose-400' : r.rate >= 20 ? 'bg-amber-400' : 'bg-emerald-400')}
                    style={{ width: `${r.rate ?? 0}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-muted-foreground tabular-nums w-9 text-right">
                  {r.rate == null ? '—' : `${r.rate}%`}
                </span>
              </div>
              <p className="text-[0.7rem] text-muted-foreground mt-1">
                {r.reacted}/{r.total} {t('food.cooking_reacted')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}