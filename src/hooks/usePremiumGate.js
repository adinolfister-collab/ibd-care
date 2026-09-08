import { useState, useCallback } from 'react';
import { useSubscription } from '@/hooks/useSubscription';

/**
 * Gate for premium (subscription-gated) actions. A logged-in free user can
 * read everything; any write/recording action calls requirePremium() first:
 * subscribed users proceed, free users get the PremiumPaywall overlay.
 */
export function usePremiumGate() {
  const { isSubscribed, loading } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  const requirePremium = useCallback(() => {
    if (isSubscribed) return true;
    setShowPaywall(true);
    return false;
  }, [isSubscribed]);

  return { isSubscribed, loading, requirePremium, showPaywall, setShowPaywall };
}