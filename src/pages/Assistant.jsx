import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import VoiceButton from '@/components/VoiceButton';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const SUGGESTIONS_IT = [
  'Registra un sintomo: dolore 3, stanchezza 5, 4 scariche oggi',
  'Come vanno i miei sintomi ultimamente?',
  'Cosa posso fare in questa app?',
];

export default function Assistant() {
  const { t, lang } = useI18n();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const convRef = useRef(null);

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
    setText('');
    setSending(true);
    try {
      await base44.agents.addMessage(convRef.current, { role: 'user', content: value });
    } catch (e) {
      setSending(false);
    }
  };

  const busy = sending && messages[messages.length - 1]?.role !== 'assistant';

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
      <PageHeader
        title={t('assistant.title')}
        subtitle={t('assistant.subtitle')}
      />
      <PageEditorial pageKey="assistant" compact />

      <Card className="flex-1 flex flex-col overflow-hidden rounded-2xl">
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
        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {SUGGESTIONS_IT.map((s) => (
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

        {/* Input */}
        <div className="border-t border-border p-3 flex items-end gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={t('assistant.placeholder')}
            className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <VoiceButton onResult={(txt) => setText((cur) => (cur ? cur + ' ' : '') + txt)} />
          <button
            onClick={() => send()}
            disabled={!text.trim() || sending}
            className="shrink-0 w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </Card>
    </div>
  );
}