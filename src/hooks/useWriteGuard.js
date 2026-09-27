import { useCallback } from 'react';
import { useRegisterGate } from '@/hooks/useRegisterGate';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { trackTrialFeature } from '@/lib/trialTracking';

// Combined write gate for diary pages. An unauthenticated visitor is sent to
// register (useRegisterGate); an authenticated user whose 30-day trial has
// expired (or who never subscribed) hits the Premium paywall instead. Use
// `guard(feature)` in every add/edit/delete handler — the optional feature
// name (e.g. "symptom_write") emits a trial_feature_used event: 'used' during
// trial, 'blocked' after expiry. Render <ReadonlyBanner/> at the top and
// <PremiumPaywall/> with the returned open/onClose.
export function useWriteGuard() {
  const registerGate = useRegisterGate();
  const { requirePremium, showPaywall, setShowPaywall, isSubscribed } = usePremiumGate();
  const guard = useCallback((feature) => {
    if (!registerGate()) return false; // guest → register redirect
    if (isSubscribed) {
      if (feature) trackTrialFeature(feature, 'used');
      return true;
    }
    if (feature) trackTrialFeature(feature, 'blocked');
    requirePremium();
    return false;
  }, [registerGate, requirePremium, isSubscribed]);
  return { guard, showPaywall, setShowPaywall, isSubscribed };
}