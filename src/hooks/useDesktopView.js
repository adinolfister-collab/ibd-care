import { useState, useEffect, useCallback } from 'react';

// Toggles a "force desktop layout" preference persisted in localStorage and
// synced across components via a custom event (so MobileTopNav and AppLayout
// react to the same flag without a provider).
const KEY = 'ibdcare:forceDesktop';
const EVENT = 'ibdcare:desktopview-change';

function read() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

export function useDesktopView() {
  const [forceDesktop, setForceDesktop] = useState(read);

  useEffect(() => {
    const handler = () => setForceDesktop(read());
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const toggle = useCallback(() => {
    setForceDesktop((cur) => {
      const next = !cur;
      try { localStorage.setItem(KEY, next ? '1' : '0'); } catch {}
      window.dispatchEvent(new Event(EVENT));
      return next;
    });
  }, []);

  return { forceDesktop, toggle };
}