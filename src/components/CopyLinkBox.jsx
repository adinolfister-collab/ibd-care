import React, { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Box "copia-incolla" stile Rivista mediterranea: campo in sola lettura con
// l'URL pubblico della pagina e pulsante per copiarlo negli appunti.
// Mostra stato "copiato" in verde per ~2 secondi.
export default function CopyLinkBox({ url }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="my-5 max-w-xl">
      <div className="flex items-center gap-2 rounded-xl border border-terracotta/60 bg-card shadow-sm pl-3 pr-1.5 py-1.5">
        <Link2 className="w-4 h-4 text-terracotta shrink-0" />
        <input
          type="text"
          readOnly
          value={url}
          aria-label={t('news.copy_link') || 'Copia link'}
          className="flex-1 min-w-0 bg-transparent font-heading text-sm text-foreground tracking-tight outline-none truncate"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium transition-colors bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span className={copied ? 'text-emerald-600' : ''}>
            {copied ? (t('news.copied') || 'Copiato') : (t('news.copy_link') || 'Copia link')}
          </span>
        </button>
      </div>
    </div>
  );
}