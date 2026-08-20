import React, { useState, useRef, useEffect } from 'react';
import { Languages, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const LANGS = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

// Pulsante unico selettore lingue con icona a colori (gradiente
// teal → sabbia → terracotta) e menu a tendina delle 6 lingue.
export default function LanguageMenu({ className }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Seleziona lingua"
        className="h-9 w-9 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 ring-1 ring-white/30"
        style={{ backgroundImage: 'linear-gradient(135deg, hsl(180 48% 28%), hsl(43 60% 62%), hsl(19 55% 57%))' }}
      >
        <Languages className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left',
                lang === l.code ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-foreground'
              )}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="flex-1">{l.label}</span>
              {lang === l.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}