import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

const EMOJIS = ['❤️', '👍', '🙏', '💪'];

// Fila di reazioni emoji sotto un messaggio (community o DM). Tap = aggiungi,
// tap di nuovo = rimuovi. Aggiornamento live via subscribe.
export default function MessageReactions({ messageId, messageType = 'community', meId, meName, participants = [] }) {
  const { t } = useI18n();
  const { authChecked, isAuthenticated } = useAuth();
  const [reactions, setReactions] = useState([]);

  const load = async () => {
    try {
      const data = await base44.entities.MessageReaction.filter({
        message_type: messageType,
        message_id: messageId,
      });
      setReactions(data);
    } catch (e) {
      setReactions([]);
    }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.MessageReaction.subscribe(load);
    return unsub;
  }, [messageId, messageType]);

  const toggle = async (emoji) => {
    if (!isAuthenticated || !meId) return;
    const existing = reactions.find((r) => r.user_id === meId && r.emoji === emoji);
    try {
      if (existing) {
        await base44.entities.MessageReaction.delete(existing.id);
      } else {
        await base44.entities.MessageReaction.create({
          message_type: messageType,
          message_id: messageId,
          user_id: meId,
          user_name: meName || 'Utente',
          emoji,
          participants: messageType === 'dm' ? participants : [],
        });
      }
      load();
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1" role="group" aria-label={t('community.reactions_label')}>
      {EMOJIS.map((emoji) => {
        const mine = reactions.some((r) => r.user_id === meId && r.emoji === emoji);
        const count = reactions.filter((r) => r.emoji === emoji).length;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(emoji)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
              mine
                ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                : 'bg-accent text-accent-foreground hover:bg-accent/70'
            )}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-[10px] font-medium">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}