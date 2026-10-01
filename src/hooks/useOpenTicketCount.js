import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Hook per admin: conta i ticket di supporto aperti (status=open).
// Aggiorna il conteggio al mount e poi ogni 60 secondi.
// Restituisce null se non abilitato (non admin) o in fase di caricamento
// iniziale, e il numero (>=0) quando disponibile.
export function useOpenTicketCount(isAdmin) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      setCount(null);
      return;
    }
    let cancelled = false;

    const fetchCount = async () => {
      try {
        const open = await base44.entities.SupportTicket.filter({ status: 'open' }, '-created_date', 200);
        if (!cancelled) setCount(open ? open.length : 0);
      } catch {
        if (!cancelled) setCount(null);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAdmin]);

  return count;
}