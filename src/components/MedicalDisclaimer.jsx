import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Disclaimer medico richiesto dalla Google Play Health App Policy per app
// sanitarie non regolamentate come dispositivo medico. Visibile in-app
// (About, Settings) e riportabile nella descrizione dello store.
export default function MedicalDisclaimer({ className }) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        'rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm leading-relaxed text-foreground/80 select-text',
        className,
      )}
      role="note"
    >
      <p className="flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <span>{t('medical.disclaimer')}</span>
      </p>
    </div>
  );
}