import React from 'react';
import { useI18n } from '@/lib/i18n';
import { BRISTOL_KEYS } from '@/lib/enumLabels';
import { cn } from '@/lib/utils';

// Selettore grafico della Scala di Bristol: 7 chip visive cliccabili.
// Riusabile nel diario sintomi e nella sezione visita medica.
// value: numero 1-7 (stool_consistency). onChange: (n) => void.
export default function BristolScalePicker({ value, onChange, className }) {
  const { t } = useI18n();
  const types = [1, 2, 3, 4, 5, 6, 7];
  // Palette visiva ispirata alla scala Bristol ufficiale.
  const swatch = (n) => {
    const colors = ['#92400e', '#a16207', '#b45309', '#16a34a', '#65a30d', '#eab308', '#f97316'];
    return colors[n - 1];
  };
  const isLiquid = (n) => n >= 5;
  return (
    <div className={cn('grid grid-cols-7 gap-1.5', className)}>
      {types.map((n) => {
        const active = Number(value) === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(active ? '' : n)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl border p-2 transition-all min-h-[60px]',
              active ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-border bg-card hover:border-terracotta/40'
            )}
            aria-pressed={active}
            aria-label={t(BRISTOL_KEYS[n])}
          >
            <span
              className="w-6 h-6 rounded-full shrink-0 border border-black/10"
              style={{ background: swatch(n) }}
            />
            <span className={cn('text-[0.6rem] font-semibold leading-none', isLiquid(n) ? 'text-amber-600' : 'text-muted-foreground')}>
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}