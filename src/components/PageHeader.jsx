import React from 'react';
import { Image } from '@/components/ui/image';

const HERO_IMG = 'https://media.base44.com/images/public/6a80de4be246a7b03417c238/caa358a8a_generated_image.png';

// Calm "Sereno mediterraneo" hero: a teal-overlaid meditative image carrying the
// page title (serif) and a short description. The optional action sits in a row
// below the banner (on the light background) so buttons stay readable.
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="relative overflow-hidden rounded-3xl border border-primary/15 shadow-sm">
        <Image src={HERO_IMG} fittingType="fill" alt="" className="w-full h-40 md:h-48 block" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/65 to-primary/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/55 to-transparent" />
        <div className="absolute inset-0 p-5 md:p-7 flex items-end">
          <div className="max-w-2xl">
            {title && (
              <h1 className="font-heading text-2xl md:text-[2rem] font-semibold tracking-tight text-primary-foreground leading-tight drop-shadow-sm">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm md:text-base text-primary-foreground/90 mt-1.5 leading-relaxed max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
      {action && (
        <div className="flex justify-end gap-2 mt-3 flex-wrap">{action}</div>
      )}
    </div>
  );
}