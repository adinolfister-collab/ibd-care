import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LifeBuoy, Loader2, Send, Sparkles, LogIn, MessageSquare, HeartHandshake } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Render a un risultato dello strumento findSupportMatches come card:
// thread consigliati (link alla board) + persone simili (bottone DM).
function parseToolResults(toolCall) {
  let r = toolCall?.results;
  if (typeof r === 'string') {
    try { r = JSON.parse(r); } catch (e) { r = null; }
  }
  if (!r || r.error) return null;
  return r;
}

function MatchCards({ data, onContact, contactingId, isAuthenticated, t }) {
  if (!data) return null;
  const threads = data.threads || [];
  const people = data.people || [];
  if (threads.length === 0 && people.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {threads.length > 0 && (
        <div>
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wide text-terracotta mb-2">
            {t('support.threads_label')}
          </p>
          <div className="space-y-2">
            {threads.map((th) => (
              <Link
                key={th.id}
                to="/community"
                className="block rounded-xl border border-border bg-card px-3 py-2.5 hover:bg-accent/60 transition-colors"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center text-[0.6rem] font-semibold uppercase tracking-wide bg-terracotta/15 text-terracotta px-1.5 py-0.5 rounded-full">
                    {t(`community.cat_${th.category}`) || th.category}
                  </span>
                  {th.replies > 0 && (
                    <span className="inline-flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                      <MessageSquare className="w-3 h-3" /> {th.replies}
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground leading-snug line-clamp-2">{th.snippet}</p>
                <p className="text-[0.65rem] text-muted-foreground mt-1">— {th.author}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {people.length > 0 && (
        <div>
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wide text-terracotta mb-2">
            {t('support.people_label')}
          </p>
          <div className="space-y-2">
            {people.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-card px-3 py-2.5 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center shrink-0">
                  <span className="text-sm font-heading font-semibold text-primary">
                    {(p.name || 'U').slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[0.65rem] text-muted-foreground leading-tight">{p.reason}</p>
                </div>
                {isAuthenticated ? (
                  <button
                    onClick={() => onContact(p)}
                    disabled={contactingId === p.id}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {contactingId === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <HeartHandshake className="w-3.5 h-3.5" />
                    )}
                    {t('support.contact_btn')}
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-terracotta/50 text-terracotta text-xs font-medium hover:bg-terracotta/10 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {t('support.login_to_contact')}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupportFinderChat() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const suggestions = [1, 2, 3].map((n) => t(`support.suggestion.${n}`));
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactingId, setContactingId] = useState(null);
  const scrollRef = useRef(null);
  const convRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    (async () => {
      try {
        const c = await base44.agents.createConversation({
          agent_name: 'trovaSupporto',
          metadata: { name: 'Trova Supporto' },
        });
        if (cancelled) return;
        convRef.current = c;
        setConversationId(c.id);
        setMessages(c.messages || []);
        unsub = base44.agents.subscribeToConversation(c.id, (data) => {
          setMessages(data.messages || []);
          setSending(false);
        });
      } catch (e) {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const send = async (content) => {
    const value = (content ?? text).trim();
    if (!value || !conversationId || sending) return;
    setText('');
    setSending(true);
    try {
      await base44.agents.addMessage(convRef.current, { role: 'user', content: value });
    } catch (e) {
      setSending(false);
    }
  };

  const handleContact = async (person) => {
    setContactingId(person.id);
    try {
      const res = await base44.functions.invoke('manageDm', {
        action: 'send',
        to_user_id: person.id,
        to_user_name: person.name,
      });
      const data = res.data || res;
      toast({
        title: t('support.dm_sent_title'),
        description: data?.existed
          ? t('support.dm_exists_desc')
          : t('support.dm_sent_desc'),
      });
      navigate('/community', { state: { dmUser: { id: person.id, name: person.name } } });
    } catch (e) {
      toast({ title: t('support.dm_error'), variant: 'destructive' });
    } finally {
      setContactingId(null);
    }
  };

  const busy = sending && messages[messages.length - 1]?.role !== 'assistant';

  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl min-h-[460px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <p className="text-sm text-destructive text-center py-6">{t('support.error')}</p>
        )}
        {messages.length === 0 && !error && (
          <div className="text-center py-8 px-4">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/15 flex items-center justify-center mx-auto mb-3">
              <LifeBuoy className="w-7 h-7 text-terracotta" />
            </div>
            <p className="text-base font-heading font-medium">{t('support.greeting')}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">{t('support.hint')}</p>
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          const toolRunning = m.tool_calls?.some((tc) =>
            ['pending', 'running', 'in_progress'].includes(tc.status)
          );
          const matchTool = m.tool_calls?.find((tc) => tc.name === 'findSupportMatches');
          const matchData = matchTool ? parseToolResults(matchTool) : null;
          return (
            <div key={i} className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  isUser
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-accent text-accent-foreground rounded-bl-md'
                )}
              >
                {m.content ? (
                  isUser ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*]:my-0">
                      {m.content}
                    </ReactMarkdown>
                  )
                ) : toolRunning ? (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('support.searching')}
                  </span>
                ) : null}
              </div>
              {!isUser && matchData && (
                <div className="max-w-[92%] w-full">
                  <MatchCards
                    data={matchData}
                    onContact={handleContact}
                    contactingId={contactingId}
                    isAuthenticated={isAuthenticated}
                    t={t}
                  />
                </div>
              )}
            </div>
          );
        })}
        {busy && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-accent text-accent-foreground rounded-2xl rounded-bl-md px-4 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="px-1 pt-2 flex flex-wrap gap-2 justify-center">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-accent text-accent-foreground hover:bg-accent/70 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 md:p-5 flex items-end gap-2.5 bg-card">
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          onInput={autoGrow}
          rows={3}
          placeholder={t('support.placeholder')}
          className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3.5 text-sm leading-relaxed min-h-[96px] max-h-52 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => send()}
          disabled={!text.trim() || sending}
          className="shrink-0 min-h-[96px] min-w-[56px] h-[96px] w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
}