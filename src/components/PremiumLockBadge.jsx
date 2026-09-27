import React from 'react';
import { Lock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Lucchetto terracotta coerente per segnalare funzioni Premium.
// size="nav" → icona w-3.5 (navigazione); size="sm" → w-4 (in-page).
// showLabel → pill "Premium" con lucchetto (es. header Assistente Cary).
export default function PremiumLockBadge({ size = 'sm', showLabel = false, className = '' }) {
  const { t } = useI18n();
  if (showLabel) {
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-full bg-terracotta/15 text-terracotta px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide', className)}>
        <Lock className="w-3 h-3" />
        {t('premium.badge_label') || 'Premium'}
      </span>
    );
  }
  const iconCls = size === 'nav' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <Lock
      className={cn(iconCls, 'text-terracotta shrink-0', className)}
      aria-label={t('premium.badge_label') || 'Premium'}
    />
  );
}