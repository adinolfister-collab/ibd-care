import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Singola card: etichetta, contatore caratteri vs limite, testo in box
// readonly scrollabile e pulsante Copia con stato di conferma.
export default function PlayStoreTextCard({ item }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(item.text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = item.text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const count = item.text.length;
  const over = count > item.limit;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-heading text-lg">{item.label}</CardTitle>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
              over
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            )}
          >
            {count}/{item.limit}
          </span>
        </div>
        <CardDescription>{item.hint}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className={cn(
            'overflow-auto rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90',
            count > 120 ? 'h-56' : 'h-auto'
          )}
          data-selectable
        >
          {item.text}
        </div>
        <Button
          onClick={copy}
          variant={copied ? 'secondary' : 'default'}
          className="mt-3 w-full"
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copiato!' : 'Copia testo'}
        </Button>
      </CardContent>
    </Card>
  );
}