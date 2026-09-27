import React from 'react';
import { Eye } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Piccolo indicatore "sola lettura" (occhio) per la vista 7gg libera.
export default function ReadonlyBadge({ className = '' }) {
  const { t } = useI18n();
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <Eye className="w-3.5 h-3.5" />
      {t('chart.readonly')}
    </span>
  );
}