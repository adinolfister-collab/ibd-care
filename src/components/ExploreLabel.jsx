import React from 'react';
import { Compass } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Eyebrow editoriale "Esplora risorse" in cima a ogni pagina: sobrio,
// coeso con il linguaggio "rivista mediterranea" di PageHeader e SiteMenu.
// Reso una sola volta da AppLayout così da coprire tutte le pagine.
export default function ExploreLabel() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 mb-4 md:mb-5 select-none">
      <Compass className="w-3.5 h-3.5 text-terracotta shrink-0" />
      <div className="h-px w-5 bg-terracotta/60" />
      <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">
        {t('nav.explore_risorse') || 'Esplora risorse'}
      </p>
    </div>
  );
}