import { useCallback } from 'react';
import { useRegisterGate } from '@/hooks/useRegisterGate';
import { usePremiumGate } from '@/hooks/usePremiumGate';

// Combined write gate for diary pages. An unauthenticated visitor is sent to
// register (useRegisterGate); an authenticated user whose 30-day trial has
// expired (or who never subscribed) hits the Premium paywall instead. Use
// `guard()` in every add/edit/delete handler. Render <ReadonlyBanner/> at the
// top and <PremiumPaywall/> with the returned open/onClose.
export function useWriteGuard() {
  const registerGate = useRegisterGate();
  const { requirePremium, showPaywall, setShowPaywall } = usePremiumGate();
  const guard = useCallback(() => {
    if (!registerGate()) return false;
    return requirePremium();
  }, [registerGate, requirePremium]);
  return { guard, showPaywall, setShowPaywall };
}