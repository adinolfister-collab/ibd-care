import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useWriteGate } from '@/hooks/usePremiumGate';

// Shown at the top of diary pages when the 30-day trial has expired and the
// user is not subscribed: data is read-only; recording requires Premium.
export default function ReadonlyBanner() {
  const { t } = useI18n();
  const { isReadOnly } = useWriteGate();
  if (!isReadOnly) return null;
  return (
    <div className="mb-4 rounded-xl border border-terracotta/40 bg-terracotta/[0.07] px-4 py-3 flex items-center gap-3">
      <Lock className="w-4 h-4 text-terracotta shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{t('trial.expired_title')}</p>
        <p className="text-xs text-muted-foreground leading-snug">{t('trial.readonly_hint')}</p>
      </div>
      <Link
        to="/abbonamento"
        className="shrink-0 rounded-lg bg-terracotta text-terracotta-foreground text-xs font-semibold px-3 py-2 hover:bg-terracotta/90 transition-colors"
      >
        {t('trial.cta_subscribe')}
      </Link>
    </div>
  );
}