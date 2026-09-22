import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useDesktopView } from '@/hooks/useDesktopView';
import { cn } from '@/lib/utils';

// Lets a phone-width user switch to the full desktop sidebar layout (and
// back). Hidden on real desktop screens, where the layout is already desktop.
export default function DesktopViewToggle() {
  const { t } = useI18n();
  const { forceDesktop, toggle } = useDesktopView();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  if (!isMobile) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('nav.desktop_view')}
      title={t('nav.desktop_view')}
      className={cn(
        'h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0',
        forceDesktop
          ? 'bg-terracotta/15 text-terracotta'
          : 'text-muted-foreground hover:bg-accent'
      )}
    >
      {forceDesktop ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
    </button>
  );
}