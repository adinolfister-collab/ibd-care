import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Module-level cache so navigation between pages (which remounts AppLayout
// under the keyed-route transition) doesn't refetch / flicker the paywall.
let cache = null;
let inflight = null;

export function clearSubscriptionCache() {
  cache = null;
  inflight = null;
}

// Demo mode: an unauthenticated visitor is treated as a Premium subscriber
// (status 'demo') so every Premium-gated UI unlocks for them. Writes go to
// localStorage, costly features return simulated responses — no backend call
// is ever made for a guest, so no credits are spent.
const DEMO = { status: 'demo', isDemo: true };

export function useSubscription() {
  const { isAuthenticated, authChecked } = useAuth();
  const isGuest = authChecked && !isAuthenticated;
  const [state, setState] = useState(() => (cache ? { data: cache, loading: false } : { data: null, loading: true }));

  const load = useCallback(async () => {
    if (isGuest) {
      cache = DEMO;
      setState({ data: DEMO, loading: false });
      return DEMO;
    }
    try {
      const res = await base44.functions.invoke('getSubscriptionStatus', {});
      cache = res.data || { status: 'none' };
    } catch (e) {
      cache = { status: 'none' };
    }
    setState({ data: cache, loading: false });
    return cache;
  }, [isGuest]);

  useEffect(() => {
    if (!authChecked) return;
    if (isGuest) {
      cache = DEMO;
      setState({ data: DEMO, loading: false });
      return;
    }
    if (cache && !cache.isDemo) {
      setState({ data: cache, loading: false });
      return;
    }
    if (!inflight) {
      inflight = load().finally(() => { inflight = null; });
    } else {
      inflight.then(() => setState({ data: cache, loading: false }));
    }
  }, [load, isGuest, authChecked]);

  const status = state.data?.status || 'none';
  const isSubscribed = isGuest || ['active', 'trialing'].includes(status);
  const isTrialing = status === 'trialing';
  const isExpired = status === 'expired';
  const isDemo = isGuest || state.data?.isDemo === true;
  const trialRemaining = state.data?.trialRemaining ?? 0;
  const trialEnd = state.data?.trialEnd ?? null;

  return { ...state, status, isSubscribed, isTrialing, isExpired, isDemo, trialRemaining, trialEnd, reload: load };
}