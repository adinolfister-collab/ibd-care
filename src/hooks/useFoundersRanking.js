import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Fetches the public Founder campaign ranking. Cached at module level so
// the banner, the page and the community mini-ranking don't each refetch.
let cache = null;

export function clearFoundersCache() {
  cache = null;
}

export function useFoundersRanking() {
  const [state, setState] = useState(() => (cache ? { data: cache, loading: false } : { data: null, loading: true }));

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('getFoundersRanking', {});
      cache = res.data || null;
    } catch (e) {
      cache = null;
    }
    setState({ data: cache, loading: false });
    return cache;
  }, []);

  useEffect(() => {
    if (cache) {
      setState({ data: cache, loading: false });
      return;
    }
    load();
  }, [load]);

  return { ...state, reload: load };
}