import React, { useRef, useState } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const THRESHOLD = 70;

// Touch-based pull-to-refresh. Expands an inline spacer (no transform) so it
// never interferes with fixed/sticky chrome. No-op on desktop (no touch).
export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  const onTouchStart = (e) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    if (startY.current == null) return;
    if (window.scrollY > 0) { startY.current = null; return; }
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      pulling.current = true;
      setPull(Math.min(delta * 0.5, 110));
    }
  };

  const onTouchEnd = async () => {
    if (!pulling.current) { startY.current = null; return; }
    pulling.current = false;
    startY.current = null;
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(44);
      try { await onRefresh?.(); } finally { setRefreshing(false); setPull(0); }
    } else {
      setPull(0);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-center overflow-hidden transition-[height] duration-150" style={{ height: refreshing ? 44 : pull }}>
        {refreshing ? (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        ) : pull > 8 ? (
          <ArrowDown className={cn('w-5 h-5 text-muted-foreground transition-transform', pull >= THRESHOLD ? 'rotate-180 text-primary' : '')} />
        ) : null}
      </div>
      {children}
    </div>
  );
}