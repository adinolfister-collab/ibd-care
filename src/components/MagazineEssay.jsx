import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { themeImage } from '@/lib/themeImages';
import { cn } from '@/lib/utils';

// Saggio fotografico "Rivista mediterranea": foto tematica a tutta larghezza
// con nastro numero modulo terracotta, eyebrow + titolo serif, didascalia,
// riga sottile e contenuto (children) sotto.
//
// Props:
//   theme    chiave in THEME_IMAGES (es. "sintomi")
//   number   numero modulo mostrato sul nastro (es. "01")
//   eyebrow  piccola etichetta maiuscola sopra il titolo
//   title    titolo serif del saggio
//   caption  didascalia sotto la foto
//   to       se presente, il titolo diventa un link alla pagina tematica
//   children contenuto del saggio (dati, liste, form)
export default function MagazineEssay({ theme, number, eyebrow, title, caption, to, children, className = '' }) {
  const img = theme ? themeImage(theme) : themeImage('serena');
  return (
    <section className={`mb-8 md:mb-10 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <Image src={img} fittingType="fill" alt="" className="w-full h-40 md:h-56 block" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/35 to-primary/10" />
        {number && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-terracotta text-terracotta-foreground text-xs font-heading font-semibold tracking-wide">
            N. {number}
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 p-4 md:p-5 max-w-2xl">
          {to ? (
            <Link to={to} className="group inline-block">
              {eyebrow && (
                <p className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.25em] text-primary-foreground/80">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="mt-1 font-heading text-xl md:text-2xl font-semibold text-primary-foreground leading-tight drop-shadow-sm inline-flex items-center gap-2">
                  {title}
                  <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-terracotta" />
                </h2>
              )}
              <span className="block h-0.5 w-10 group-hover:w-20 transition-all duration-300 bg-terracotta mt-2 rounded-full" />
            </Link>
          ) : (
            <>
              {eyebrow && (
                <p className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.25em] text-primary-foreground/80">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="mt-1 font-heading text-xl md:text-2xl font-semibold text-primary-foreground leading-tight drop-shadow-sm">
                  {title}
                </h2>
              )}
            </>
          )}
        </div>
      </div>
      {caption && (
        <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">{caption}</p>
      )}
      <div className="h-px bg-border mt-4" />
      <div className="mt-4">{children}</div>
    </section>
  );
}