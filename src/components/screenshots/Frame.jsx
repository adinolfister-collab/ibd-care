import React from 'react';
import { cn } from '@/lib/utils';

// Contenitore frame 9:16 per il generatore di screenshot. Mostra la schermata
// a tutta altezza con una didascalia italiana sovrapposta in alto
// (sfondo primary semitrasparente, font-heading). Lo sfondo neutro tra un
// frame e l'altro è gestito dalla pagina.
export default function Frame({ caption, index, children, className = '' }) {
  return (
    <figure className="relative w-full max-w-[420px] mx-auto">
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-[2rem] border border-border bg-background shadow-lg',
          className
        )}
        style={{ aspectRatio: '9 / 16' }}
      >
        {/* Didascalia sovrapposta in alto */}
        <figcaption className="absolute top-0 inset-x-0 z-20 px-4 py-3 bg-primary/85 backdrop-blur-sm">
          <p className="text-[0.6rem] font-heading font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            IBD Care · {String(index + 1).padStart(2, '0')}
          </p>
          <p className="mt-0.5 font-heading text-base font-semibold text-primary-foreground leading-tight">
            {caption}
          </p>
        </figcaption>
        {/* Contenuto schermata, scrollabile/ritagliato */}
        <div className="absolute inset-0 pt-16 overflow-hidden">
          {children}
        </div>
      </div>
    </figure>
  );
}