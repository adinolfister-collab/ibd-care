import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageSquareOff, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';
import MessageComposer from './MessageComposer';
import MessageReactions from './MessageReactions';
import TranslatedText from './TranslatedText';
import MentionText from './MentionText';
import SharedEntryCard from './SharedEntryCard';
import DmRequests from './DmRequests';
import { useCommunityUsers } from './useCommunityUsers';
import { timeAgoShort } from './helpers';

// Sezione messaggi privati 1:1. Lista conversazioni attive + chat selezionata.
// Riceve pendingUser per avviare una nuova richiesta dalla board.
export default function CommunityDm({ me, pendingUser, onPendingHandled }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { requirePremium, isSubscribed } = usePremiumGate();
  const users = useCommunityUsers();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const loadConversations = async () => {
    try {
      const all = await base44.entities.DirectMessageConversation.filter({ status: 'active' });
      setConversations(all);
    } catch (e) { setConversations([]); }
  };

  useEffect(() => {
    loadConversations();
    const unsub = base44.entities.DirectMessageConversation.subscribe(loadConversations);
    return unsub;
  }, [me?.id]);

  // Avvia richiesta DM per pendingUser
  useEffect(() => {
    if (!pendingUser || !me) return;
    (async () => {
      try {
        const res = await base44.functions.invoke('manageDm', {
          action: 'send',
          to_user_id: pendingUser.id,
          to_user_name: pendingUser.name,
        });
        const data = res.data || res;
        if (data.status === 'active') {
          setActiveId(data.conversation_id);
        } else {
          toast({ title: t('community.dm_request_sent') });
        }
      } catch (e) {
        toast({ title: e.message || 'Errore', variant: 'destructive' });
      }
      onPendingHandled && onPendingHandled();
    })();
  }, [pendingUser, me]);

  const activeConv = conversations.find((c) => c.id === activeId);

  const loadMessages = async () => {
    if (!activeId) return;
    try {
      const data = await base44.entities.DirectMessage.filter({ conversation_id: activeId });
      setMessages(data);
    } catch (e) { setMessages([]); }
  };

  useEffect(() => {
    loadMessages();
    if (!activeId) { setMessages([]); return; }
    const unsub = base44.entities.DirectMessage.subscribe(loadMessages);
    return unsub;
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const otherName = (c) => {
    if (!c) return '';
    return c.participant_a_id === me?.id ? c.participant_b_name : c.participant_a_name;
  };
  const participants = activeConv ? [activeConv.participant_a_id, activeConv.participant_b_id] : [];

  const send = async (content, mentions, shared) => {
    if (!isSubscribed) { requirePremium(); return; }
    if (!activeConv) return;
    setSending(true);
    try {
      await base44.entities.DirectMessage.create({
        conversation_id: activeConv.id,
        content,
        sender_id: me.id,
        sender_name: me.full_name || 'Utente',
        participants,
        mentions: mentions || [],
        shared_entry: shared || null,
      });
      // aggiorna last_message + notifica l'altro
      const otherId = activeConv.participant_a_id === me.id ? activeConv.participant_b_id : activeConv.participant_a_id;
      try {
        await base44.entities.DirectMessageConversation.update(activeConv.id, {
          last_message: content.slice(0, 80),
          last_date: new Date().toISOString(),
        });
      } catch (e) {}
      try {
        await base44.entities.Notification.create({
          user_id: otherId,
          type: 'dm_message',
          title: me.full_name || 'Utente',
          body: content.slice(0, 100),
          link: '/community',
          payload: { conversation_id: activeConv.id },
          read: false,
        });
      } catch (e) {}
      // notifiche menzioni
      if (mentions && mentions.length) {
        for (const mnt of mentions) {
          if (mnt.user_id && mnt.user_id !== me.id && mnt.user_id !== otherId) {
            try {
              await base44.entities.Notification.create({
                user_id: mnt.user_id,
                type: 'mention',
                title: me.full_name || 'Utente',
                body: content.slice(0, 100),
                link: '/community',
                payload: {},
                read: false,
              });
            } catch (e) {}
          }
        }
      }
      loadMessages();
    } catch (e) {
      toast({ title: e.message || 'Errore', variant: 'destructive' });
    }
    setSending(false);
  };

  // Vista chat
  if (activeConv) {
    return (
      <div className="flex flex-col h-[70vh]">
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <button type="button" onClick={() => setActiveId(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> {t('community.dm_back')}
          </button>
          <div className="flex-1 text-center">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center text-sm font-medium mr-2">
              {(otherName(activeConv) || 'U').charAt(0).toUpperCase()}
            </span>
            <span className="font-medium text-sm">{otherName(activeConv)}</span>
          </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">{t('community.dm_no_messages')}</p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === me?.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${mine ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
                    {m.shared_entry && <SharedEntryCard entry={m.shared_entry} />}
                    <div className={m.shared_entry ? 'mt-1' : ''}>
                      <TranslatedText message={m} messageType="dm" />
                    </div>
                    {m.mentions && m.mentions.length > 0 && (
                      <div className="mt-1 text-[11px] opacity-80">
                        <MentionText content="" mentions={m.mentions} />
                      </div>
                    )}
                    <div className={`mt-1 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      <MessageReactions
                        messageId={m.id}
                        messageType="dm"
                        meId={me?.id}
                        meName={me?.full_name}
                        participants={participants}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="border-t border-border p-3">
          <MessageComposer
            onSubmit={send}
            placeholder={t('community.dm_placeholder')}
            users={users}
            me={me}
            disabled={sending}
          />
        </div>
      </div>
    );
  }

  // Vista lista
  return (
    <div>
      <DmRequests meId={me?.id} onAccepted={(c) => setActiveId(c.id)} />
      {conversations.length === 0 ? (
        <EmptyState icon={MessageSquareOff} title={t('community.dm_no_conversations')} />
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const name = otherName(c);
            return (
              <Card key={c.id} className="cursor-pointer hover:border-primary/40 transition-colors" >
                <CardContent className="p-3 flex items-center gap-3" onClick={() => setActiveId(c.id)}>
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0">
                    {(name || 'U').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{name || 'Utente'}</p>
                    {c.last_message && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message}</p>
                    )}
                  </div>
                  {c.last_date && (
                    <span className="text-[11px] text-muted-foreground shrink-0">{timeAgoShort(c.last_date)}</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}