import React, { useMemo } from 'react';
import { Flame, Beef, Wheat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { computeDayTotals, buildCatalogMap } from '@/lib/nutrition';
import { useI18n } from '@/lib/i18n';

// Card "Nutrizione di oggi": totale di calorie e proteine dei pasti della
// giornata corrente, con l'elenco dei cibi. I valori sono una stima basata
// sul catalogo (per 100 g) e sulle quantità inserite.
export default function DailyNutrition({ entries, groups }) {
  const { t } = useI18n();
  const today = new Date().toISOString().slice(0, 10);

  const totals = useMemo(() => {
    const map = buildCatalogMap(groups);
    const todayEntries = (entries || []).filter((e) => (e.entry_date || '') === today);
    return computeDayTotals(todayEntries, map);
  }, [entries, groups, today]);

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-terracotta/10 to-accent/40">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-terracotta" />
          <h2 className="font-heading text-lg font-semibold text-primary">{t('food.nutrition_today')}</h2>
        </div>
        {totals.kcal === 0 && totals.proteine === 0 ? (
          <p className="text-sm text-muted-foreground">{t('food.nutrition_empty')}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 mb-3">
              <div className="flex items-baseline gap-1.5">
                <Flame className="w-4 h-4 text-terracotta self-center" />
                <span className="font-heading text-2xl font-semibold text-foreground">{totals.kcal}</span>
                <span className="text-sm text-muted-foreground">{t('food.kcal_unit')}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <Beef className="w-4 h-4 text-primary self-center" />
                <span className="font-heading text-2xl font-semibold text-foreground">{totals.proteine}</span>
                <span className="text-sm text-muted-foreground">{t('food.prot_unit')}</span>
              </div>
            </div>
            {totals.foods.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {totals.foods.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/80 text-xs border border-border">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground">· {f.kcal} {t('food.kcal_unit')} · {f.proteine} {t('food.prot_unit')}</span>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-3 italic">{t('food.nutrition_disclaimer')}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}