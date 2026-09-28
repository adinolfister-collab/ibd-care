import { useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';

// Gate for data-recording actions on public pages. In demo mode the
// unauthenticated visitor is allowed to proceed (writes persist to
// localStorage via guestEntries) — no redirect to /register. Returns true
// once auth has resolved. Authenticated users always proceed (the premium
// gate handles their subscription state).
export function useRegisterGate() {
  const { isAuthenticated, authChecked } = useAuth();
  return useCallback(() => {
    if (!authChecked) return false;
    return true;
  }, [authChecked, isAuthenticated]);
}