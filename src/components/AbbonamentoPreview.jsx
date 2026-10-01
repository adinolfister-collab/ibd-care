import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Image } from '@/components/ui/image';
import { themeImage } from '@/lib/themeImages';

// Carosello di anteprime (screenshot tematici) delle funzioni principali,
// mostrato sopra i piani in /abbonamento. Dà un'anteprima concreta del valore
// prima del muro di prezzo. Scroll-snap orizzontale, leggero, niente logica.
const SLIDES = [
  { img: 'sintomi', titleKey: 'abb.preview_sintomi', descKey: 'abb.preview_sintomi_desc' },
  { img: 'alimentazione', titleKey: 'abb.preview_food', descKey: 'abb.preview_food_desc' },
  { img: 'serena', titleKey: 'abb.preview_correlazioni', descKey: 'abb.preview_correlazioni_desc' },
  { img: 'community', titleKey: 'abb.preview_assistant', descKey: 'abb.preview_assistant_desc' },
  { img: 'esami', titleKey: 'abb.preview_referti', descKey: 'abb.preview_referti_desc' },
];

export default function AbbonamentoPreview() {
  const { t } = useI18n();
  return (
    <section className="mb-6">
      <h2 className="font-heading text-lg font-semibold text-foreground mb-1">
        {t('abb.preview_title')}
      </h2>
      <p className="text-sm text-muted-foreground mb-3">{t('abb.preview_subtitle')}</p>
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1 -mx-1 px-1">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="snap-center shrink-0 w-[78%] sm:w-[46%] lg:w-[31%] rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
          >
            <div className="relative h-32 sm:h-36 overflow-hidden">
              <Image
                src={themeImage(s.img)}
                fittingType="fill"
                alt=""
                className="w-full h-full block"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent" />
            </div>
            <div className="p-3">
              <h3 className="font-heading text-sm font-semibold text-foreground leading-tight">
                {t(s.titleKey)}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {t(s.descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}