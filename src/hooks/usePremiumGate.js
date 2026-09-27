import { useState, useCallback } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/AuthContext';

/**
 * Gate for premium (subscription-gated) actions. After the 30-day trial
 * expires, the diary becomes read-only: every write action is gated, not
 * only the AI/PDF/scanner features. `requirePremium()` opens the paywall for
 * both "none" (no trial yet / web visitor) and "expired" states.
 */
export function usePremiumGate() {
  const { isSubscribed, loading, status, isExpired, isTrialing } = useSubscription();
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;
  const [showPaywall, setShowPaywall] = useState(false);

  const requirePremium = useCallback(() => {
    if (isSubscribed) return true;
    setShowPaywall(true);
    return false;
  }, [isSubscribed]);

  return { isSubscribed, loading, status, isExpired, isTrialing, isGuest, requirePremium, showPaywall, setShowPaywall };
}

/**
 * Coarse write gate for diary pages: returns whether recording actions are
 * allowed (subscribed or within trial). Used to disable/hide "Add" buttons
 * and surface a read-only banner when the trial has expired.
 */
export function useWriteGate() {
  const { isSubscribed, loading, status, isExpired } = useSubscription();
  const { isAuthenticated } = useAuth();
  const canWrite = loading ? true : isSubscribed;
  const isReadOnly = !loading && !isSubscribed && status === 'expired';
  const isGuest = !isAuthenticated;
  return { canWrite, isReadOnly, isGuest, isExpired, loading, status };
}