import React, { useEffect, useState, useRef } from 'react';
import { Users, Send, MessageSquare, Trash2, CornerDownRight, ShieldCheck, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import VoiceButton from '@/components/VoiceButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'ora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString();
}

export default function Community() {
  const { t } = useI18n();
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState('');
  const [me, setMe] = useState(null);
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState({});
  const replyRefs = useRef({});

  const load = async () => {
    const data = await base44.entities.CommunityMessage.list('-created_date', 500);
    setMessages(data);
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setMe(u);
      } catch (e) {}
      try {
        await load();
      } catch (e) {
        setMessages([]);
      }
    })();
    const unsub = base44.entities.CommunityMessage.subscribe(() => {
      load();
    });
    return unsub;
  }, []);

  const post = async (content, parentId = null) => {
    if (!content || !content.trim() || posting) return;
    if (containsBanned(content)) {
      setModerationWarning('Il messaggio contiene linguaggio non appropriato. Riformulalo per mantenere lo spazio accogliente.');
      return;
    }
    setModerationWarning('');
    setPosting(true);
    try {
      await base44.entities.CommunityMessage.create({
        content: content.trim(),
        author_name: me?.full_name || 'Utente',
        parent_id: parentId,
      });
      if (!parentId) setText('');
      else setReplyText((s) => ({ ...s, [parentId]: '' }));
      setReplyTo(null);
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id) => {
    await base44.entities.CommunityMessage.delete(id);
  };

  const [moderationWarning, setModerationWarning] = useState('');
  const isAdmin = me?.role === 'admin';

  const BANNED = ['stronzo','stronz','cazzo','figa','puttana','troia','merda','minchia','negro','mongolo','ritardato','frocio','ricchione','bastardo','vaffanculo','fuck','shit','bitch','asshole','slut','retard','nigger','faggot'];
  const containsBanned = (txt) => {
    const low = (txt || '').toLowerCase();
    return BANNED.some((w) => low.includes(w));
  };

  const moderate = async (id) => {
    try {
      await base44.functions.invoke('moderateCommunityMessage', { message_id: id });
    } catch (e) {
      setModerationWarning('Impossibile rimuovere il messaggio. Riprova.');
    }
  };

  const topLevel = (messages || []).filter((m) => !m.parent_id);
  const repliesOf = (id) => (messages || []).filter((m) => m.parent_id === id);

  return (
    <div>
      <PageHeader
        title={t('community.title')}
        subtitle={t('community.subtitle')}
        icon={Users}
      />

      {/* Community guidelines */}
      <Card className="mb-5 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Spazio sicuro e accogliente</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Condividi esperienze e consigli con rispetto: niente linguaggio offensivo o discriminazione, e ricorda che i messaggi non sostituiscono il parere medico. I moderatori possono rimuovere i contenuti non idonei.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Composer */}
      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('community.placeholder')}
              rows={2}
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <VoiceButton onResult={(txt) => setText((c) => (c ? c + ' ' : '') + txt)} />
            <Button
              onClick={() => post(text)}
              disabled={!text.trim() || posting}
              className="h-12 px-5"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">{t('community.post')}</span>
            </Button>
          </div>
          {moderationWarning && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 text-amber-800 px-3 py-2 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{moderationWarning}</span>
            </div>
          )}
          {isAdmin && (
            <p className="mt-2 text-[11px] text-primary flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Sei moderatore: puoi rimuovere qualsiasi messaggio.
            </p>
          )}
        </CardContent>
      </Card>

      {!messages ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : topLevel.length === 0 ? (
        <EmptyState icon={MessageSquare} title={t('community.empty')} />
      ) : (
        <div className="space-y-4">
          {topLevel.map((m) => {
            const mine = me && m.created_by_id === me.id;
            const reps = repliesOf(m.id);
            return (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0">
                      {(m.author_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{m.author_name || t('community.anonymous')}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{timeAgo(m.created_date)}</span>
                          {(mine || isAdmin) && (
                            <button
                              onClick={() => (mine ? remove(m.id) : moderate(m.id))}
                              className={cn('transition-colors', mine ? 'text-muted-foreground hover:text-destructive' : 'text-primary hover:text-primary/80')}
                              title={mine ? 'Elimina' : 'Rimuovi come moderatore'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap break-words">{m.content}</p>

                      <button
                        onClick={() => setReplyTo(replyTo === m.id ? null : m.id)}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        {t('community.reply')}
                      </button>

                      {replyTo === m.id && (
                        <div className="mt-2 flex items-end gap-2">
                          <textarea
                            value={replyText[m.id] || ''}
                            onChange={(e) => setReplyText((s) => ({ ...s, [m.id]: e.target.value }))}
                            placeholder={t('community.placeholder')}
                            rows={1}
                            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                          <Button size="sm" onClick={() => post(replyText[m.id] || '', m.id)} disabled={!(replyText[m.id] || '').trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Replies */}
                      {reps.length > 0 && (
                        <div className="mt-3 space-y-2 pl-3 border-l-2 border-border">
                          {reps.map((r) => {
                            const rMine = me && r.created_by_id === me.id;
                            return (
                              <div key={r.id} className="flex items-start gap-2">
                                <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-medium shrink-0">
                                  {(r.author_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium text-xs">{r.author_name || t('community.anonymous')}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-muted-foreground">{timeAgo(r.created_date)}</span>
                                      {(rMine || isAdmin) && (
                                        <button
                                          onClick={() => (rMine ? remove(r.id) : moderate(r.id))}
                                          className={cn('transition-colors', rMine ? 'text-muted-foreground hover:text-destructive' : 'text-primary hover:text-primary/80')}
                                          title={rMine ? 'Elimina' : 'Rimuovi come moderatore'}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{r.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}