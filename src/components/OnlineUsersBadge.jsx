import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';

// Contatore virtuale "utenti online": numero plausibile che fluttua di poco
// nel tempo. Il valore base è stabile per sessione (seed deterministico).
export default function OnlineUsersBadge({ className = '' }) {
  const { t } = useI18n();
  const [count, setCount] = useState(() => {
    // Seed stabile per sessione: base 120-160 deterministica dal timestamp di apertura.
    const seed = Math.floor((Date.now() / 1000) % 1000);
    return 1 + (seed % 160);
  });
  const current = useRef(count);

  useEffect(() => {
    let timer;
    const tick = () => {
      setCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
        let next = prev + delta;
        if (next < 1) next = 1;
        if (next > 160) next = 160;
        current.current = next;
        return next;
      });
      // Prossimo tick tra 5 e 8 secondi.
      timer = setTimeout(tick, 5000 + Math.floor(Math.random() * 3001));
    };
    timer = setTimeout(tick, 5000 + Math.floor(Math.random() * 3001));
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card text-foreground text-xs font-medium shrink-0 ${className}`}
      title={t('header.online_users') || 'Utenti online'}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>{count}</span>
      <span className="hidden sm:inline text-muted-foreground">{t('header.online_users') || 'online'}</span>
    </div>
  );
}