import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/lib/i18n';
import { getEditorialSection } from '@/lib/editorialContent';
import { themeImage } from '@/lib/themeImages';
import { cn } from '@/lib/utils';

// Saggio editoriale "Rivista mediterranea" da inserire dentro le sezioni di
// pagina: mostra una foto tematica + titolo serif + regaletta terracotta +
// paragrafo localizzato. Solo presentazionale.
//
// Props:
//   sectionKey  chiave in SECTIONS (es. "symptoms_journal")
//   align      "left" (foto a sinistra) | "right" (foto a destra)
//   compact    riduce l'altezza dell'immagine
//   number     numero modulo opzionale (nastro terracotta sulla foto)
//   to         se presente, l'intero blocco diventa un link alla pagina
export default function EditorialBlock({ sectionKey, align = 'left', compact = false, number, to, className = '' }) {
  const { lang } = useI18n();
  const { theme, title, body } = getEditorialSection(lang, sectionKey);
  const img = themeImage(theme);
  const reverse = align === 'right';

  const inner = (
    <>
      <div className="relative md:w-2/5 shrink-0 overflow-hidden">
        <Image
          src={img}
          fittingType="fill"
          alt=""
          className={`w-full block ${compact ? 'h-32 md:h-full' : 'h-44 md:h-52'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
        {number && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-terracotta text-terracotta-foreground text-xs font-heading font-semibold">
            N. {number}
          </div>
        )}
      </div>
      <div className="p-5 md:p-8 md:w-3/5 flex flex-col justify-center">
        <p className="font-heading text-xl md:text-2xl font-semibold text-primary tracking-tight leading-snug inline-flex items-center gap-2">
          {title}
          {to && <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-terracotta" />}
        </p>
        <div className={cn('h-px bg-terracotta/70 my-3 transition-all duration-300', to ? 'w-12 group-hover:w-20' : 'w-12')} />
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
          {body}
        </p>
      </div>
    </>
  );

  const card = (
    <div className={`overflow-hidden rounded-2xl border border-border bg-card shadow-sm flex flex-col md:flex-row ${reverse ? 'md:flex-row-reverse' : ''}`}>
      {inner}
    </div>
  );

  return (
    <div className={`my-8 md:my-10 ${className}`}>
      {to ? (
        <Link to={to} className="group block">{card}</Link>
      ) : (
        card
      )}
    </div>
  );
}