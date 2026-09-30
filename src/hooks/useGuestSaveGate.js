import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { FREE_SAVES, readGuestSaveCount, writeGuestSaveCount } from '@/lib/guestSaveCount';
import { trackGuestActivity } from '@/lib/guestTracking';

/**
 * Gate for guest (unauthenticated) data-saving actions.
 *  - kind === 'diary': guests get FREE_SAVES saves (local) then the paywall.
 *  - kind === 'cloud': guests can never persist without an account, so any
 *    attempt opens the paywall immediately without consuming the free quota.
 * Authenticated users always pass through.
 */
export function useGuestSaveGate() {
  const { isAuthenticated, authChecked } = useAuth();
  const isGuest = authChecked && !isAuthenticated;
  const [count, setCount] = useState(() => readGuestSaveCount());
  const [showPaywall, setShowPaywall] = useState(false);

  const remaining = Math.max(0, FREE_SAVES - count);
  const canSave = !isGuest || count < FREE_SAVES;

  const attemptSave = useCallback((kind = 'diary') => {
    if (!isGuest) return true;
    if (kind === 'cloud') {
      trackGuestActivity('diary_save', 'blocked');
      setShowPaywall(true);
      return false;
    }
    const c = readGuestSaveCount();
    if (c >= FREE_SAVES) {
      trackGuestActivity('diary_save', 'blocked');
      setShowPaywall(true);
      return false;
    }
    const next = c + 1;
    writeGuestSaveCount(next);
    setCount(next);
    return true;
  }, [isGuest]);

  return { isGuest, count, remaining, canSave, attemptSave, showPaywall, setShowPaywall };
}