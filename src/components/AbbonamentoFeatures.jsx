import React from 'react';
import { Check, Crown, Minus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Tabella comparativa completa: 5 funzioni nel piano gratuito (✓ Free) e
// 12 funzioni in Premium (AI con badge "3/mese" nella colonna Free, le altre ✗).
// Tutte le chiavi sono già tradotte nelle 11 lingue.
export default function AbbonamentoFeatures() {
  const { t } = useI18n();

  const FREE_FEATURES = [
    { name: t('abb.free.news.name'), desc: t('abb.free.news.desc') },
    { name: t('abb.free.diary.name'), desc: t('abb.free.diary.desc') },
    { name: t('abb.free.food.name'), desc: t('abb.free.food.desc') },
    { name: t('abb.free.community.name'), desc: t('abb.free.community.desc') },
    { name: t('abb.free.account.name'), desc: t('abb.free.account.desc') },
  ];

  const PREMIUM_FEATURES = [
    { name: t('abb.premium.history.name'), desc: t('abb.premium.history.desc'), free: false },
    { name: t('abb.premium.therapy.name'), desc: t('abb.premium.therapy.desc'), free: false },
    { name: t('abb.premium.records.name'), desc: t('abb.premium.records.desc'), free: false },
    { name: t('abb.premium.exams.name'), desc: t('abb.premium.exams.desc'), free: false },
    { name: t('abb.premium.import.name'), desc: t('abb.premium.import.desc'), free: false },
    { name: t('abb.premium.charts.name'), desc: t('abb.premium.charts.desc'), free: false },
    { name: t('abb.premium.correlation.name'), desc: t('abb.premium.correlation.desc'), free: false },
    { name: t('abb.premium.reports.name'), desc: t('abb.premium.reports.desc'), free: false },
    { name: t('abb.premium.summary.name'), desc: t('abb.premium.summary.desc'), free: false },
    { name: t('abb.premium.ai.name'), desc: t('abb.premium.ai.desc'), free: 'limit' },
    { name: t('abb.premium.map.name'), desc: t('abb.premium.map.desc'), free: false },
    { name: t('abb.premium.templates.name'), desc: t('abb.premium.templates.desc'), free: false },
  ];

  const gridClass = 'grid grid-cols-[1fr_72px_72px] sm:grid-cols-[1fr_96px_96px]';

  const Mark = ({ on }) => (
    <span className="inline-flex items-center justify-center">
      {on ? <Check className="w-4 h-4 text-emerald-600" /> : <Minus className="w-4 h-4 text-muted-foreground/50" />}
    </span>
  );

  const FreeCell = ({ value }) => {
    if (value === 'limit') {
      return (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium leading-none">
          {t('abb.ai_limit')}
        </span>
      );
    }
    return <Mark on={value} />;
  };

  const SectionHeader = ({ label }) => (
    <div className={`${gridClass} bg-primary/[0.04]`}>
      <div className="px-4 py-2.5 col-span-3">
        <p className="font-heading text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );

  const Row = ({ name, desc, freeValue, premiumValue, alt }) => (
    <div className={`${gridClass} ${alt ? 'bg-accent/20' : ''}`}>
      <div className="px-4 py-3 border-b border-border/60">
        <p className="text-sm font-medium text-foreground leading-snug">{name}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
      </div>
      <div className="px-2 sm:px-4 py-3 border-b border-l border-border/60 flex items-center justify-center">
        <FreeCell value={freeValue} />
      </div>
      <div className="px-2 sm:px-4 py-3 border-b border-l border-border/60 flex items-center justify-center bg-terracotta/[0.03]">
        <Mark on={premiumValue} />
      </div>
    </div>
  );

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
        <div className={gridClass}>
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

        {/* Free section */}
        <SectionHeader label={t('abb.col_free')} />
        {FREE_FEATURES.map((f, i) => (
          <Row key={f.name} name={f.name} desc={f.desc} freeValue={true} premiumValue={true} alt={i % 2 === 1} />
        ))}

        {/* Premium section */}
        <SectionHeader label={t('abb.col_premium')} />
        {PREMIUM_FEATURES.map((f, i) => (
          <Row key={f.name} name={f.name} desc={f.desc} freeValue={f.free} premiumValue={true} alt={i % 2 === 1} />
        ))}
      </div>
    </div>
  );
}