import React from 'react';
import { useI18n } from '@/lib/i18n';
import { getEditorial } from '@/lib/editorialContent';

// Standfirst "Rivista mediterranea": tra masthead e saggi, una breve
// introduzione serif con regaletta terracotta verticale. Solo presentazionale,
// non tocca la logica di pagina.
//
// Props:
//   pageKey  chiave in editorialContent (es. "symptoms")
export default function PageEditorial({ pageKey, className = '' }) {
  const { lang } = useI18n();
  const { label, desc } = getEditorial(lang, pageKey);

  return (
    <div className={`mb-6 md:mb-8 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-2 h-10 w-1.5 rounded-full bg-terracotta shrink-0" />
        <div className="max-w-2xl">
          <p className="font-heading text-lg md:text-xl font-semibold text-primary tracking-tight leading-snug">
            {label}
          </p>
          <p className="mt-1.5 text-sm md:text-[0.95rem] text-muted-foreground leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}