import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { computeTherapyCorrelation } from '@/lib/triggerCorrelation';
import EmptyState from '@/components/EmptyState';
import { Pill, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { localeForLang } from '@/lib/enumLabels';
import { cn } from '@/lib/utils';

// Vista di correlazione longitudinale terapia-sintomi: per ogni terapia con
// start_date mostra l'andamento del dolore medio 30 giorni prima vs dopo.
export default function TherapyCorrelation({ meds, symptoms, lang }) {
  const { t } = useI18n();
  const rows = computeTherapyCorrelation(meds, symptoms);
  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString(localeForLang(lang), { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  if (!rows.length) {
    return <EmptyState icon={Pill} title={t('therapy_corr.empty')} description={t('therapy_corr.empty_desc')} />;
  }
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const beforePain = r.before.pain;
        const afterPain = r.after.pain;
        const improved = beforePain != null && afterPain != null && afterPain < beforePain;
        const worsened = beforePain != null && afterPain != null && afterPain > beforePain;
        const Icon = improved ? TrendingDown : worsened ? TrendingUp : Minus;
        const tone = improved ? 'text-emerald-600' : worsened ? 'text-rose-500' : 'text-muted-foreground';
        return (
          <Card key={r.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{t('therapy_corr.start')} {fmtDate(r.start_date)}</p>
                </div>
                <Icon className={cn('w-5 h-5', tone)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">{t('therapy_corr.before')}</p>
                  <p className="text-lg font-semibold mt-0.5">{beforePain != null ? `${beforePain.toFixed(1)}/10` : '—'}</p>
                  <p className="text-[0.65rem] text-muted-foreground">{r.before.count} {t('therapy_corr.entries')}</p>
                </div>
                <div className="rounded-xl bg-accent/50 p-3">
                  <p className="text-xs text-muted-foreground">{t('therapy_corr.after')}</p>
                  <p className="text-lg font-semibold mt-0.5">{afterPain != null ? `${afterPain.toFixed(1)}/10` : '—'}</p>
                  <p className="text-[0.65rem] text-muted-foreground">{r.after.count} {t('therapy_corr.entries')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}