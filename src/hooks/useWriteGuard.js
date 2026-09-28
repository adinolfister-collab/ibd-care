import { useCallback } from 'react';
import { useRegisterGate } from '@/hooks/useRegisterGate';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { trackTrialFeature } from '@/lib/trialTracking';

// Combined write gate for diary pages. In demo mode (unauthenticated guest)
// writes are allowed and persisted to localStorage. An authenticated user
// whose 30-day trial has expired (or who never subscribed) hits the Premium
// paywall instead. Use `guard(feature)` in every add/edit/delete handler —
// the optional feature name (e.g. "symptom_write") emits a trial_feature_used
// event: 'used' during trial, 'blocked' after expiry. Render <ReadonlyBanner/>
// at the top and <PremiumPaywall/> with the returned open/onClose.
export function useWriteGuard() {
  const registerGate = useRegisterGate();
  const { requirePremium, showPaywall, setShowPaywall, isSubscribed, isDemo } = usePremiumGate();
  const guard = useCallback((feature) => {
    if (isDemo) return true; // demo mode: persist to localStorage
    if (!registerGate()) return false;
    if (isSubscribed) {
      if (feature) trackTrialFeature(feature, 'used');
      return true;
    }
    if (feature) trackTrialFeature(feature, 'blocked');
    requirePremium();
    return false;
  }, [registerGate, requirePremium, isSubscribed, isDemo]);
  return { guard, showPaywall, setShowPaywall, isSubscribed, isDemo };
}