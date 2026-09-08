import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Costruisce la lista degli utenti della community a partire dai messaggi
// pubblici (CommunityMessage ha read aperto). Ogni utente = { id, name }.
// Utile per autocomplete menzioni e nuovo DM.
export function useCommunityUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const msgs = await base44.entities.CommunityMessage.list('-created_date', 200);
        if (!mounted) return;
        const map = new Map();
        for (const m of msgs) {
          const uid = m.created_by_id;
          const name = m.author_name || 'Utente';
          if (uid && !map.has(uid)) map.set(uid, { id: uid, name });
        }
        setUsers(Array.from(map.values()));
      } catch (e) {
        setUsers([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return users;
}