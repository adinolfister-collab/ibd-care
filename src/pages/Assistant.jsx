import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import MicToggle from '@/components/MicToggle';
import PremiumPaywall from '@/components/PremiumPaywall';
import { useAuth } from '@/lib/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function Assistant() {
  const { t, lang } = useI18n();
  const suggestions = [1, 2, 3].map((n) => t(`assistant.suggestion.${n}`));
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const FREE_LIMIT = 3;
  const scrollRef = useRef(null);
  const convRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    setMsgCount(user?.ai_messages_month === currentMonth ? (user.ai_messages_count || 0) : 0);
  }, [user?.ai_messages_count, user?.ai_messages_month]);

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    (async () => {
      try {
        const c = await base44.agents.createConversation({
          agent_name: 'assistente',
          metadata: { name: 'Assistente IBD' },
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

  const send = async (content) => {
    const value = (content ?? text).trim();
    if (!value || !conversationId || sending) return;
    if (!isSubscribed && msgCount >= FREE_LIMIT) { setShowPaywall(true); return; }
    setText('');
    setSending(true);
    if (!isSubscribed) setMsgCount((c) => c + 1);
    try {
      await base44.agents.addMessage(convRef.current, { role: 'user', content: value });
      if (!isSubscribed) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        try { await base44.auth.updateMe({ ai_messages_count: msgCount + 1, ai_messages_month: currentMonth }); } catch (e) { /* non blocking */ }
      }
    } catch (e) {
      setSending(false);
      if (!isSubscribed) setMsgCount((c) => Math.max(0, c - 1));
    }
  };

  const busy = sending && messages[messages.length - 1]?.role !== 'assistant';

  return (
    <div className="flex flex-col min-h-[calc(100vh-7.5rem)] md:min-h-[calc(100vh-7.5rem)]">
      <PageHeader
        title={t('assistant.title')}
        subtitle={t('assistant.subtitle')}
      />
      <PageEditorial pageKey="assistant" compact />

      <Card className="flex-1 flex flex-col overflow-hidden rounded-2xl min-h-[420px]">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <p className="text-sm text-destructive text-center py-6">{t('assistant.error')}</p>
          )}
          {messages.length === 0 && !error && (
            <div className="text-center py-8 px-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <p className="text-base font-medium">{t('assistant.greeting')}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{t('assistant.hint')}</p>
            </div>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            const toolRunning = m.tool_calls?.some((tc) => ['pending', 'running', 'in_progress'].includes(tc.status));
            return (
              <div key={i} className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-accent text-accent-foreground rounded-bl-md'
                  )}
                >
                  {m.content ? (
                    isUser ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <ReactMarkdown className="prose prose-sm max-w-none [&>*]:my-0">{m.content}</ReactMarkdown>
                    )
                  ) : toolRunning ? (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('assistant.working')}
                    </span>
                  ) : null}
                  {m.tool_calls?.length > 0 && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                      ⚙ {t('assistant.tool_used')}
                    </p>
                  )}
                </div>
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

          {/* Suggestions (inside scroll area so the input bar never covers them) */}
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

        {/* Free message counter */}
        {!isSubscribed && (
          <div className="px-4 py-2 text-center border-t border-border bg-accent/30">
            <span className="text-xs text-muted-foreground">
              {msgCount < FREE_LIMIT ? t('assistant.free_count').replace('{n}', String(msgCount)) : t('assistant.limit_reached')}
            </span>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4 md:p-5 flex items-end gap-2.5 bg-card">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            onInput={autoGrow}
            rows={3}
            placeholder={t('assistant.placeholder')}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3.5 text-sm leading-relaxed min-h-[96px] max-h-52 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <MicToggle lang={lang} onTranscript={send} />
          <button
            onClick={() => send()}
            disabled={!text.trim() || sending}
            className="shrink-0 min-h-[96px] min-w-[56px] h-[96px] w-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </Card>
      <PremiumPaywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}