import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function AppSupportChat() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) setMessages([{ role: 'assistant', text: t('support.greeting') }]);
  }, [open]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput('');
    const prior = messages;
    const next = [...prior, { role: 'user', text: q }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await base44.functions.invoke('appFeaturesAdvisor', {
        question: q,
        history: prior.map((m) => ({ role: m.role, text: m.text }))
      });
      const ans = res.data?.answer || res.data?.error || t('support.error');
      setMessages([...next, { role: 'assistant', text: ans }]);
    } catch (e) {
      setMessages([...next, { role: 'assistant', text: t('support.error') }]);
    } finally {
      setBusy(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Link to={`/login?returnTo=${encodeURIComponent('/abbonamento')}`} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
        <Bot className="w-4 h-4" /> Accedi per chiedere all&rsquo;assistente
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
          <Bot className="w-4 h-4" /> {t('support.button')}
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /> {t('support.title')}</DialogTitle>
        </DialogHeader>

        <div ref={scrollRef} className="space-y-2 max-h-72 overflow-y-auto pr-1 -mr-1">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <span className={cn('inline-block px-3 py-2 rounded-2xl text-sm max-w-[85%] leading-relaxed whitespace-pre-line', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}>
                {m.text}
              </span>
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> {t('support.thinking')}</div>}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('support.placeholder')}
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" size="icon" disabled={busy} className="rounded-xl" aria-label={t('support.button')}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}