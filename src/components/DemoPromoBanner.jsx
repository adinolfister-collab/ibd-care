import React from 'react';
import { Sparkles } from 'lucide-react';

// Banner promozionale bilingue IT/EN visibile in cima alla pagina demo.
// Il testo è volutamente statico (copy promozionale dedicato alla demo)
// per garantire la versione bilingue anche su lingue non IT/EN.
const IT_TEXT =
  'Prova IBD Care gratis per 30 giorni: diario sintomi, alimentazione, terapie e community per chi vive con il morbo di Crohn e la colite ulcerosa. Nessun account richiesto.';
const EN_TEXT =
  "Try IBD Care free for 30 days: symptom diary, food tracking, therapy management and community for people living with Crohn's disease and ulcerative colitis. No account required.";

export default function DemoPromoBanner() {
  return (
    <div className="mb-6 rounded-2xl border border-terracotta/30 bg-gradient-to-br from-terracotta/[0.07] to-primary/[0.04] p-5 md:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-terracotta" />
        <span className="text-[11px] font-heading font-semibold uppercase tracking-[0.2em] text-terracotta">
          IBD Care · Demo
        </span>
      </div>
      <p className="text-sm md:text-base text-foreground/90 leading-relaxed select-text">
        {IT_TEXT}
      </p>
      <p className="mt-2.5 text-xs md:text-sm text-muted-foreground leading-relaxed select-text italic">
        {EN_TEXT}
      </p>
    </div>
  );
}