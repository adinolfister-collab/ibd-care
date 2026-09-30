import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { cn } from '@/lib/utils';
import PremiumLockBadge from '@/components/PremiumLockBadge';
import PremiumPaywall from '@/components/PremiumPaywall';
import { trackTrialFeature } from '@/lib/trialTracking';
import { trackGuestActivity } from '@/lib/guestTracking';
import { CHART_RANGES } from '@/lib/chartRanges';

// Selettore di range temporale standardizzato per le pagine grafici.
// Three-state gate:
//  - guest: nessun lucchetto; click su range Premium → /login
//  - trialing: nessun lucchetto; range Premium sbloccato + tracking 'used'
//  - expired: lucchetto terracotta; click → paywall + tracking 'blocked'
export default function ChartRangeSelector({
  value,
  onChange,
  feature = 'chart_range',
  className = '',
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isSubscribed, isExpired, isGuest, requirePremium, showPaywall, setShowPaywall } = usePremiumGate();

  const handle = (r) => {
    if (!r.premium || isSubscribed) {
      if (r.premium) trackTrialFeature(feature, 'used');
      onChange(r.key);
      return;
    }
    if (isGuest) { trackGuestActivity(feature, 'blocked'); navigate('/login'); return; }
    trackTrialFeature(feature, 'blocked');
    requirePremium();
  };

  return (
    <>
      <div className={cn('flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1', className)}>
        {CHART_RANGES.map((r) => {
          const active = r.key === value;
          const locked = r.premium && isExpired;
          return (
            <button
              key={r.key}
              onClick={() => handle(r)}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : locked
                    ? 'bg-accent text-muted-foreground border border-terracotta/30'
                    : 'bg-accent text-accent-foreground'
              )}
            >
              {t(r.labelKey)}
              {locked && <PremiumLockBadge size="sm" className="opacity-90" />}
            </button>
          );
        })}
      </div>
      <PremiumPaywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
}