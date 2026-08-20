import React from 'react';
import { Image } from '@/components/ui/image';
import { themeImage } from '@/lib/themeImages';
import { useI18n } from '@/lib/i18n';

// Masthead "Rivista mediterranea": foto tematica a tutta larghezza con
// eyebrow serif, titolo grande e sottotitolo; sotto, una sottile riga
// terracotta e le azioni. Mantiene le props (title, subtitle, action) così
// tutte le pagine che usano PageHeader si aggiornano automaticamente.
export default function PageHeader({ title, subtitle, action }) {
  const { t } = useI18n();
  return (
    <div className="mb-6 md:mb-8">
      <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
        <Image
          src={themeImage('serena')}
          fittingType="fill"
          alt=""
          className="w-full h-44 md:h-60 block"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/50 to-primary/15" />
        <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-end max-w-2xl">
          <p className="text-[0.65rem] md:text-xs font-heading font-semibold uppercase tracking-[0.25em] text-primary-foreground/85">
            {t('app.name')} · Rivista mediterranea
          </p>
          {title && (
            <h1 className="mt-2 font-heading text-2xl md:text-4xl font-semibold tracking-tight text-primary-foreground leading-[1.1] drop-shadow-sm">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-2 text-sm md:text-base text-primary-foreground/90 leading-relaxed max-w-lg">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="h-px bg-terracotta/70 mt-4 mb-3" />
      {action && (
        <div className="flex justify-end gap-2 flex-wrap">{action}</div>
      )}
    </div>
  );
}