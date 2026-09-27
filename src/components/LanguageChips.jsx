import React from 'react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const LANGS = [
  { code: 'it', label: '🇮🇹 IT' },
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'es', label: '🇪🇸 ES' },
  { code: 'fr', label: '🇫🇷 FR' },
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'pt', label: '🇵🇹 PT' },
  { code: 'ru', label: '🇷🇺 RU' },
  { code: 'pl', label: '🇵🇱 PL' },
  { code: 'ro', label: '🇷🇴 RO' },
  { code: 'sq', label: '🇦🇱 SQ' },
  { code: 'zh', label: '🇨🇳 ZH' },
];

// Fila compatta di chip per le 11 lingue, scorrevole orizzontalmente.
// Sostituisce il bottone circolare LanguageMenu nell'header globale.
export default function LanguageChips({ className }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={cn('flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5', className)}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          aria-label={l.label}
          aria-pressed={lang === l.code}
          className={cn(
            'shrink-0 h-8 px-2.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap',
            lang === l.code
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-accent-foreground hover:bg-primary/10'
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}