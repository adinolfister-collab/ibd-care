import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import PremiumLockBadge from '@/components/PremiumLockBadge';
import PremiumPaywall from '@/components/PremiumPaywall';
import { trackPremiumAttempt } from '@/lib/premiumTracking';
import { CHART_RANGES } from '@/lib/chartRanges';

// Selettore di range temporale standardizzato per le pagine grafici.
// - Il range libero (7gg) è sempre selezionabile.
// - I range Premium mostrano il lucchetto terracotta; al click di un
//   utente non abbonato aprono il paywall (loggato) o rimandano al login
//   (ospite) invece di cambiare range.
export default function ChartRangeSelector({
  value,
  onChange,
  feature = 'chart_range',
  className = '',
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { isSubscribed, requirePremium, showPaywall, setShowPaywall } = usePremiumGate();
  const { isAuthenticated } = useAuth();

  const handle = (r) => {
    if (!r.premium || isSubscribed) {
      onChange(r.key);
      return;
    }
    trackPremiumAttempt(feature, 'range_selector');
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    requirePremium();
  };

  return (
    <>
      <div className={cn('flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1', className)}>
        {CHART_RANGES.map((r) => {
          const active = r.key === value;
          const locked = r.premium && !isSubscribed;
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