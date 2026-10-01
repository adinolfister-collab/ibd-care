import React from 'react';
import { useI18n } from '@/lib/i18n';
import { SUPPORT_REASONS, getReasonTemplate } from '@/lib/supportTemplates';
import { cn } from '@/lib/utils';

// Selettore motivi ticket: lista verticale con label in grassetto e
// descrizione in testo secondario, in stile "rivista mediterranea".
export default function ReasonSelector({ value, onChange }) {
  const { t } = useI18n();
  const current = getReasonTemplate(value);

  return (
    <div>
      <div className="space-y-1.5">
        {SUPPORT_REASONS.map((r) => {
          const selected = r.value === value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => onChange(r.value)}
              className={cn(
                'w-full text-left rounded-xl border p-3 transition-all',
                selected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-terracotta/40'
              )}
            >
              <p className={cn('text-sm font-medium', selected ? 'text-primary' : 'text-foreground')}>
                {t(r.labelKey)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {t(r.descKey)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}