import React from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { UNITS } from '@/lib/foodCatalog';
import { unitLabel } from '@/lib/enumLabels';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Radix-based unit picker shared by the food checklist rows. Replaces native
// <select> elements for visual consistency and better WebView behavior.
export default function UnitSelect({ value, onChange, className }) {
  const { t } = useI18n();
  const current = value || 'porzione';
  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger
        aria-label={t('food.default_unit')}
        className={cn(
          'h-8 w-[5.5rem] rounded-lg border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring',
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {UNITS.map((u) => (
          <SelectItem key={u.value} value={u.value}>
            {unitLabel(t, u.value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}