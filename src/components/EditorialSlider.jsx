import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { themeImage } from '@/lib/themeImages';
import { cn } from '@/lib/utils';

// Slider editoriale in home: foto + descrizioni tematiche curate
// (Sereno mediterraneo). Auto-avanzamento con frecce e dot.
const slides = [
  {
    img: themeImage('serena'),
    title: 'Ascolta il tuo corpo',
    desc: 'Registra ogni giorno dolore, stanchezza e scariche: piccoli gesti per ritrovare il tuo equilibrio.',
  },
  {
    img: themeImage('alimentazione'),
    title: 'Scopri il cibo che ti fa bene',
    desc: 'Annota i pasti e individua tolleranze e fattori scatenanti, giorno dopo giorno.',
  },
  {
    img: themeImage('terapie'),
    title: 'Terapie sempre sotto controllo',
    desc: 'Promemoria per farmaci e iniezioni: niente più dosi dimenticate, anche in viaggio.',
  },
  {
    img: themeImage('mappa'),
    title: 'Servizi utili, sempre a portata',
    desc: 'Centri IBD, farmacie e bagni pubblici vicino a te, per ogni evenienza.',
  },
];

export default function EditorialSlider() {
  const [i, setI] = useState(0);
  const next = useCallback(() => setI((p) => (p + 1) % slides.length), []);
  const prev = () => setI((p) => (p - 1 + slides.length) % slides.length);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  const slide = slides[i];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/15 shadow-sm mb-6 select-none">
      <div className="relative h-56 md:h-64">
        <Image src={slide.img} fittingType="fill" alt={slide.title} className="w-full h-full block" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 pb-7">
          <h3 className="font-heading text-xl md:text-2xl font-semibold text-primary-foreground leading-tight drop-shadow-sm">
            {slide.title}
          </h3>
          <p className="text-sm md:text-base text-primary-foreground/90 mt-1.5 leading-relaxed max-w-xl">
            {slide.desc}
          </p>
        </div>

        <button
          onClick={prev}
          aria-label="Precedente"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/30 backdrop-blur text-primary-foreground flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          aria-label="Successiva"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/30 backdrop-blur text-primary-foreground flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute top-3 right-4 flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all',
                idx === i ? 'w-5 bg-primary-foreground' : 'w-1.5 bg-primary-foreground/50'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}