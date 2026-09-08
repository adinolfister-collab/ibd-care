import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { Check, X, Clock } from 'lucide-react';
import { timeAgoShort } from './helpers';

// Sezione richieste di conversazione privata: incoming (io sono participant_b,
// posso accettare/rifiutare) e outgoing (io sono participant_a, in attesa).
export default function DmRequests({ meId, onAccepted }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [busy, setBusy] = useState({});

  const load = async () => {
    try {
      const all = await base44.entities.DirectMessageConversation.filter({ status: 'pending' });
      setIncoming(all.filter((c) => c.participant_b_id === meId));
      setOutgoing(all.filter((c) => c.participant_a_id === meId));
    } catch (e) { setIncoming([]); setOutgoing([]); }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.DirectMessageConversation.subscribe(load);
    return unsub;
  }, [meId]);

  const act = async (conv, action) => {
    setBusy((b) => ({ ...b, [conv.id]: true }));
    try {
      await base44.functions.invoke('manageDm', { action, conversation_id: conv.id });
      if (action === 'accept') {
        toast({ title: t('community.dm_accept') });
        if (onAccepted) onAccepted(conv);
      }
      load();
    } catch (e) {
      toast({ title: e.message || 'Errore', variant: 'destructive' });
    }
    setBusy((b) => ({ ...b, [conv.id]: false }));
  };

  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {incoming.map((c) => (
        <div key={c.id} className="rounded-xl border border-terracotta/30 bg-terracotta/5 p-3 flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-terracotta/15 text-terracotta flex items-center justify-center font-medium shrink-0">
            {(c.participant_a_name || 'U').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{c.participant_a_name || 'Utente'}</p>
            <p className="text-[11px] text-muted-foreground">{timeAgoShort(c.created_date)}</p>
          </div>
          <button
            type="button"
            onClick={() => act(c, 'accept')}
            disabled={busy[c.id]}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" /> {t('community.dm_accept')}
          </button>
          <button
            type="button"
            onClick={() => act(c, 'reject')}
            disabled={busy[c.id]}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" /> {t('community.dm_reject')}
          </button>
        </div>
      ))}
      {outgoing.map((c) => (
        <div key={c.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-medium shrink-0">
            {(c.participant_b_name || 'U').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{c.participant_b_name || 'Utente'}</p>
            <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {t('community.dm_pending_badge')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}