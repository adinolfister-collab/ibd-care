import React from 'react';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/lib/i18n';
import { getEditorial } from '@/lib/editorialContent';
import { themeImage } from '@/lib/themeImages';

// Striscia editoriale "Sereno mediterraneo" da inserire subito sotto PageHeader.
// Mostra la foto tematica della categoria + un'etichetta serif + una descrizione
// localizzata. Solo presentazionale: non tocca la logica di pagina.
//
// Props:
//   pageKey  chiave in editorialContent (es. "symptoms")
//   compact  riduce l'altezza dell'immagine (utile in pagine dense)
export default function PageEditorial({ pageKey, compact = false, className = '' }) {
  const { lang } = useI18n();
  const { theme, label, desc } = getEditorial(lang, pageKey);
  const img = themeImage(theme);

  return (
    <div className={`mb-6 md:mb-8 ${className}`}>
      <div className="overflow-hidden rounded-3xl border border-primary/15 bg-card/70 shadow-sm flex flex-col md:flex-row">
        <div className="relative md:w-2/5 shrink-0 overflow-hidden">
          <Image
            src={img}
            fittingType="fill"
            alt=""
            className={`w-full block ${compact ? 'h-28 md:h-full' : 'h-32 md:h-40'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/40 md:to-card/70" />
          <div className="absolute inset-0 bg-primary/10" />
        </div>
        <div className="p-5 md:p-7 md:w-3/5 flex flex-col justify-center">
          <p className="font-heading text-lg md:text-xl font-semibold text-primary tracking-tight leading-snug">
            {label}
          </p>
          <p className="mt-1.5 text-sm md:text-[0.95rem] text-muted-foreground leading-relaxed max-w-xl">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}