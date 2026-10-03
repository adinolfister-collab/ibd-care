import React from 'react';
import { Send, Sparkles, Volume2, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import CaryAvatar from '@/components/CaryAvatar';
import { cn } from '@/lib/utils';
import { assistantMessages, assistantSuggestions } from '@/lib/screenshotSampleData';

export default function AssistantFrame() {
  return (
    <div className="h-full flex flex-col px-3 pb-3">
      <Card className="flex-1 flex flex-col overflow-hidden rounded-2xl">
        {/* Messaggi */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          <div className="text-center py-2">
            <CaryAvatar className="w-10 h-10 mx-auto mb-1.5" />
            <p className="font-heading text-sm font-semibold text-primary">Ciao, sono Cary</p>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">Il tuo assistente IBD personale</p>
          </div>
          {assistantMessages.map((m, i) => {
            const isUser = m.role === 'user';
            return (
              <div key={i} className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
                    isUser ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-accent text-accent-foreground rounded-bl-md'
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm max-w-none [&>*]:my-0 [&_strong]:font-semibold">{m.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            );
          })}
          <div className="px-1 pt-1 flex flex-wrap gap-1.5 justify-center">
            {assistantSuggestions.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6rem] bg-accent text-accent-foreground">
                <Sparkles className="w-3 h-3" /> {s}
              </span>
            ))}
          </div>
        </div>
        {/* Input */}
        <div className="border-t border-border p-2.5 flex items-end gap-2 bg-card">
          <div className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-[0.7rem] text-muted-foreground">
            Scrivi a Cary…
          </div>
          <button type="button" className="shrink-0 flex items-center justify-center rounded-xl bg-muted text-muted-foreground h-9 w-9">
            <Mic className="w-4 h-4" />
          </button>
          <button type="button" className="shrink-0 flex items-center justify-center rounded-xl bg-terracotta text-terracotta-foreground h-9 w-9">
            <Volume2 className="w-4 h-4" />
          </button>
          <button type="button" className="shrink-0 flex items-center justify-center rounded-xl bg-primary text-primary-foreground h-9 w-10">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}