import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Module-level cache so navigation between pages (which remounts AppLayout
// under the keyed-route transition) doesn't refetch / flicker the paywall.
let cache = null;
let inflight = null;

export function clearSubscriptionCache() {
  cache = null;
  inflight = null;
}

export function useSubscription() {
  const [state, setState] = useState(() => (cache ? { data: cache, loading: false } : { data: null, loading: true }));

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('getSubscriptionStatus', {});
      cache = res.data || { status: 'none' };
    } catch (e) {
      cache = { status: 'none' };
    }
    setState({ data: cache, loading: false });
    return cache;
  }, []);

  useEffect(() => {
    if (cache) {
      setState({ data: cache, loading: false });
      return;
    }
    if (!inflight) {
      inflight = load().finally(() => { inflight = null; });
    } else {
      inflight.then(() => setState({ data: cache, loading: false }));
    }
  }, [load]);

  const status = state.data?.status || 'none';
  const isSubscribed = ['active', 'trialing'].includes(status);
  const isTrialing = status === 'trialing';
  const isExpired = status === 'expired';
  const trialRemaining = state.data?.trialRemaining ?? 0;
  const trialEnd = state.data?.trialEnd ?? null;

  return { ...state, status, isSubscribed, isTrialing, isExpired, trialRemaining, trialEnd, reload: load };
}