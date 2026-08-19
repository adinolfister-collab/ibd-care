import React from 'react';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/lib/i18n';
import { getEditorialSection } from '@/lib/editorialContent';
import { themeImage } from '@/lib/themeImages';

// Blocco editoriale "Sereno mediterraneo" da inserire dentro le sezioni di pagina.
// Mostra una foto tematica + un titolo serif + un paragrafo localizzato.
// Solo presentazionale: non tocca la logica di pagina.
//
// Props:
//   sectionKey  chiave in SECTIONS (es. "symptoms_journal")
//   align      "left" (foto a sinistra) | "right" (foto a destra)
//   compact    riduce l'altezza dell'immagine
export default function EditorialBlock({ sectionKey, align = 'left', compact = false, className = '' }) {
  const { lang } = useI18n();
  const { theme, title, body } = getEditorialSection(lang, sectionKey);
  const img = themeImage(theme);
  const reverse = align === 'right';

  return (
    <div className={`my-6 md:my-8 ${className}`}>
      <div className={`overflow-hidden rounded-3xl border border-primary/15 bg-card/80 shadow-sm flex flex-col md:flex-row ${reverse ? 'md:flex-row-reverse' : ''}`}>
        <div className="relative md:w-2/5 shrink-0 overflow-hidden">
          <Image
            src={img}
            fittingType="fill"
            alt=""
            className={`w-full block ${compact ? 'h-32 md:h-full' : 'h-40 md:h-44'}`}
          />
          <div className="absolute inset-0 bg-primary/10" />
        </div>
        <div className="p-5 md:p-7 md:w-3/5 flex flex-col justify-center">
          <p className="font-heading text-lg md:text-xl font-semibold text-primary tracking-tight leading-snug">
            {title}
          </p>
          <p className="mt-2 text-sm md:text-[0.95rem] text-muted-foreground leading-relaxed max-w-xl">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}