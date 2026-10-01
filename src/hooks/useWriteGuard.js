import { useCallback } from 'react';
import { useRegisterGate } from '@/hooks/useRegisterGate';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { useGuestSaveGate } from '@/hooks/useGuestSaveGate';
import { trackTrialFeature } from '@/lib/trialTracking';
import { trackGuestActivity } from '@/lib/guestTracking';

// Combined write gate for diary pages. In demo mode (unauthenticated guest)
// writes are allowed and persisted to localStorage; ogni multiplo di 3
// salvataggi mostra un nudge positivo non bloccante (RegisterNudge) che invita
// a registrarsi senza bloccare. An authenticated user whose 30-day trial has
// expired (or who never subscribed) hits the Premium paywall instead. Use
// `guard(feature)` in every add/edit/delete handler — the optional feature
// name (e.g. "symptom_write") emits a trial_feature_used event: 'used' during
// trial, 'blocked' after expiry. Render <ReadonlyBanner/> at the top,
// <PremiumPaywall/> and <RegisterNudge/> with the returned open/onClose.
export function useWriteGuard() {
  const registerGate = useRegisterGate();
  const { requirePremium, showPaywall, setShowPaywall, isSubscribed, isDemo } = usePremiumGate();
  const { attemptSave, showNudge, setShowNudge } = useGuestSaveGate();
  const guard = useCallback((feature) => {
    if (isDemo) { // demo mode (ospite): salva in locale + conta per il nudge
      attemptSave('diary');
      if (feature) trackGuestActivity(feature, 'used');
      return true;
    }
    if (!registerGate()) return false;
    if (isSubscribed) {
      if (feature) trackTrialFeature(feature, 'used');
      return true;
    }
    if (feature) trackTrialFeature(feature, 'blocked');
    requirePremium();
    return false;
  }, [registerGate, requirePremium, isSubscribed, isDemo, attemptSave]);
  return { guard, showPaywall, setShowPaywall, showNudge, setShowNudge, isSubscribed, isDemo };
}