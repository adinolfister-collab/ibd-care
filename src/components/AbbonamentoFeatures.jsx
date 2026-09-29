import React from 'react';
import { Check, Crown, Minus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Tabella comparativa focalizzata sulle funzionalità riservate a Premium:
// Scanner esami, Riepilogo/report PDF, Importazione referti (Free ✗ / Premium ✓)
// Assistente AI (Free 3 messaggi/mese con badge ambra / Premium ✓ illimitato).
export default function AbbonamentoFeatures() {
  const { t } = useI18n();

  const FEATURES = [
    { name: t('abb.premium.exams.name'), desc: t('abb.premium.exams.desc'), free: false, premium: true },
    { name: t('abb.premium.summary.name'), desc: t('abb.premium.summary.desc'), free: false, premium: true },
    { name: t('abb.premium.import.name'), desc: t('abb.premium.import.desc'), free: false, premium: true },
    { name: t('abb.premium.ai.name'), desc: t('abb.premium.ai.desc'), free: 'limit', premium: true },
  ];

  const Mark = ({ on }) => (
    <span className="inline-flex items-center justify-center">
      {on ? <Check className="w-4 h-4 text-emerald-600" /> : <Minus className="w-4 h-4 text-muted-foreground/50" />}
    </span>
  );

  const FreeCell = ({ value }) => {
    if (value === 'limit') {
      return (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium leading-none">
          3/mese
        </span>
      );
    }
    return <Mark on={value} />;
  };

  return (
    <div className="my-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-2 h-8 w-1.5 rounded-full bg-terracotta shrink-0" />
        <div>
          <p className="font-heading text-lg font-semibold text-primary">{t('abb.features_title')}</p>
          <p className="text-sm text-muted-foreground">{t('abb.features_desc')}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_72px_72px] sm:grid-cols-[1fr_96px_96px]">
          <div className="px-4 py-3 bg-accent/30 border-b border-border">
            <span className="font-heading text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('abb.col_feature')}</span>
          </div>
          <div className="px-2 sm:px-4 py-3 bg-accent/40 border-b border-l border-border flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4 text-primary" />
            <span className="font-heading text-sm font-semibold text-foreground hidden sm:inline">{t('abb.col_free')}</span>
          </div>
          <div className="px-2 sm:px-4 py-3 bg-terracotta/10 border-b border-l border-border flex items-center justify-center gap-1.5">
            <Crown className="w-4 h-4 text-terracotta" />
            <span className="font-heading text-sm font-semibold text-foreground hidden sm:inline">{t('abb.col_premium')}</span>
          </div>
        </div>

        {/* Rows */}
        {FEATURES.map((f, i) => (
          <div
            key={f.name}
            className={`grid grid-cols-[1fr_72px_72px] sm:grid-cols-[1fr_96px_96px] ${i % 2 === 1 ? 'bg-accent/20' : ''}`}
          >
            <div className="px-4 py-3 border-b border-border/60">
              <p className="text-sm font-medium text-foreground leading-snug">{f.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
            </div>
            <div className="px-2 sm:px-4 py-3 border-b border-l border-border/60 flex items-center justify-center">
              <FreeCell value={f.free} />
            </div>
            <div className="px-2 sm:px-4 py-3 border-b border-l border-border/60 flex items-center justify-center bg-terracotta/[0.03]">
              <Mark on={f.premium} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}