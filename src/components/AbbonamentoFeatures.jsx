import React from 'react';
import { Check, Crown } from 'lucide-react';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';
import { useI18n } from '@/lib/i18n';

function Column({ title, tone, features }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-border ${tone === 'premium' ? 'bg-terracotta/10' : 'bg-accent/40'}`}>
        {tone === 'premium' ? <Crown className="w-4 h-4 text-terracotta" /> : <Check className="w-4 h-4 text-primary" />}
        <h3 className="font-heading font-semibold text-foreground text-sm md:text-base">{title}</h3>
      </div>
      <Accordion type="single" collapsible defaultValue="item-0">
        {features.map((f, i) => (
          <AccordionItem key={f.name} value={`item-${i}`} className="border-b border-border last:border-0">
            <AccordionTrigger className="px-4 text-sm font-medium hover:no-underline">{f.name}</AccordionTrigger>
            <AccordionContent className="px-4 text-sm text-muted-foreground leading-relaxed">{f.desc}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// Due colonne a menu a tendina (accordion) che descrivono cosa è incluso
// nella prova gratuita di 14 giorni e cosa richiede l'abbonamento Premium.
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
    { name: t('abb.premium.history.name'), desc: t('abb.premium.history.desc') },
    { name: t('abb.premium.therapy.name'), desc: t('abb.premium.therapy.desc') },
    { name: t('abb.premium.records.name'), desc: t('abb.premium.records.desc') },
    { name: t('abb.premium.exams.name'), desc: t('abb.premium.exams.desc') },
    { name: t('abb.premium.charts.name'), desc: t('abb.premium.charts.desc') },
    { name: t('abb.premium.correlation.name'), desc: t('abb.premium.correlation.desc') },
    { name: t('abb.premium.reports.name'), desc: t('abb.premium.reports.desc') },
    { name: t('abb.premium.summary.name'), desc: t('abb.premium.summary.desc') },
    { name: t('abb.premium.ai.name'), desc: t('abb.premium.ai.desc') },
    { name: t('abb.premium.map.name'), desc: t('abb.premium.map.desc') },
    { name: t('abb.premium.templates.name'), desc: t('abb.premium.templates.desc') },
  ];
  return (
    <div className="my-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-2 h-8 w-1.5 rounded-full bg-terracotta shrink-0" />
        <div>
          <p className="font-heading text-lg font-semibold text-primary">{t('abb.features_title')}</p>
          <p className="text-sm text-muted-foreground">{t('abb.features_desc')}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Column title={t('abb.col_trial')} tone="free" features={FREE_FEATURES} />
        <Column title={t('abb.col_premium')} tone="premium" features={PREMIUM_FEATURES} />
      </div>
    </div>
  );
}