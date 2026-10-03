import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

// Contatore "utenti online" reale: interroga getOnlineVisitors (sessioni
// distinte attive negli ultimi 10 minuti) al mount e ogni 60 secondi.
// Su errore mantiene l'ultimo valore valido oppure mostra un trattino.
export default function OnlineUsersBadge({ className = '' }) {
  const { t } = useI18n();
  const [count, setCount] = useState(null);
  const last = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      try {
        const res = await base44.functions.invoke('getOnlineVisitors', {});
        const c = res.data?.count;
        if (active && typeof c === 'number') {
          last.current = c;
          setCount(c);
        }
      } catch (_) {
        if (active && last.current != null) setCount(last.current);
      }
    };
    fetchCount();
    const timer = setInterval(fetchCount, 60000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const display = count == null ? '—' : count;

  return (
    <div
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border bg-card text-foreground text-xs font-medium shrink-0 ${className}`}
      title={t('header.online_users')}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>{display}</span>
      <span className="hidden sm:inline text-muted-foreground">{t('header.online_users')}</span>
    </div>
  );
}