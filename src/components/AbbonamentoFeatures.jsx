import React from 'react';
import { Check, Crown, Minus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Tabella comparativa vera: una riga per funzionalità, due colonne
// (Gratis / Premium) con spunta ✓ o trattino per confronto diretto.
export default function AbbonamentoFeatures() {
  const { t } = useI18n();

  const FEATURES = [
    { name: t('abb.free.news.name'), desc: t('abb.free.news.desc'), free: true, premium: true },
    { name: t('abb.free.diary.name'), desc: t('abb.free.diary.desc'), free: true, premium: true },
    { name: t('abb.free.food.name'), desc: t('abb.free.food.desc'), free: true, premium: true },
    { name: t('abb.free.community.name'), desc: t('abb.free.community.desc'), free: true, premium: true },
    { name: t('abb.free.account.name'), desc: t('abb.free.account.desc'), free: true, premium: true },
    { name: t('abb.premium.history.name'), desc: t('abb.premium.history.desc'), free: false, premium: true },
    { name: t('abb.premium.therapy.name'), desc: t('abb.premium.therapy.desc'), free: false, premium: true },
    { name: t('abb.premium.records.name'), desc: t('abb.premium.records.desc'), free: false, premium: true },
    { name: t('abb.premium.exams.name'), desc: t('abb.premium.exams.desc'), free: false, premium: true },
    { name: t('abb.premium.import.name'), desc: t('abb.premium.import.desc'), free: false, premium: true },
    { name: t('abb.premium.charts.name'), desc: t('abb.premium.charts.desc'), free: false, premium: true },
    { name: t('abb.premium.correlation.name'), desc: t('abb.premium.correlation.desc'), free: false, premium: true },
    { name: t('abb.premium.reports.name'), desc: t('abb.premium.reports.desc'), free: false, premium: true },
    { name: t('abb.premium.summary.name'), desc: t('abb.premium.summary.desc'), free: false, premium: true },
    { name: t('abb.premium.ai.name'), desc: t('abb.premium.ai.desc'), free: false, premium: true },
    { name: t('abb.premium.map.name'), desc: t('abb.premium.map.desc'), free: false, premium: true },
    { name: t('abb.premium.templates.name'), desc: t('abb.premium.templates.desc'), free: false, premium: true },
  ];

  const Mark = ({ on }) => (
    <span className="inline-flex items-center justify-center">
      {on ? <Check className="w-4 h-4 text-emerald-600" /> : <Minus className="w-4 h-4 text-muted-foreground/50" />}
    </span>
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
        <div className="grid grid-cols-[1fr_64px_64px] sm:grid-cols-[1fr_88px_88px]">
          <div className="px-4 py-3 bg-accent/30 border-b border-border">
            <span className="font-heading text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">Funzionalità</span>
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
            className={`grid grid-cols-[1fr_64px_64px] sm:grid-cols-[1fr_88px_88px] ${i % 2 === 1 ? 'bg-accent/20' : ''}`}
          >
            <div className="px-4 py-3 border-b border-border/60">
              <p className="text-sm font-medium text-foreground leading-snug">{f.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{f.desc}</p>
            </div>
            <div className="px-2 sm:px-4 py-3 border-b border-l border-border/60 flex items-center justify-center">
              <Mark on={f.free} />
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