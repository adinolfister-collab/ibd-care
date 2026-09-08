import React, { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { usePremiumGate } from '@/hooks/usePremiumGate';

// Mostra il testo di un messaggio, tradotto nella lingua del lettore quando
// disponibile (cache translated_text). Se la traduzione non e' presente e
// l'utente e' Premium, offre il bottone "Traduci" (on-demand per risparmiare
// crediti). Toggle "mostra originale" / "mostra traduzione".
export default function TranslatedText({ message, messageType = 'community' }) {
  const { t, lang } = useI18n();
  const { requirePremium, isSubscribed } = usePremiumGate();
  const [showOriginal, setShowOriginal] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [extra, setExtra] = useState({});

  const cache = { ...(message.translated_text || {}), ...extra };
  const originalLang = message.original_lang || null;
  const isOriginal = !originalLang || originalLang === lang;
  const translation = cache[lang];

  const doTranslate = async () => {
    if (!isSubscribed) { requirePremium(); return; }
    setTranslating(true);
    try {
      const res = await base44.functions.invoke('translateMessage', {
        message_id: message.id,
        target_lang: lang,
        message_type: messageType,
      });
      const data = res.data || res;
      if (data && data.translated) {
        setExtra((c) => ({ ...c, [lang]: data.translated }));
      }
    } catch (e) { /* ignore */ }
    setTranslating(false);
  };

  if (isOriginal || !translation) {
    return (
      <div>
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        {!isOriginal && (
          <button
            type="button"
            onClick={doTranslate}
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
          >
            {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
            {translating ? t('community.translating') : t('community.translate')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm whitespace-pre-wrap break-words">{showOriginal ? message.content : translation}</p>
      <button
        type="button"
        onClick={() => setShowOriginal((s) => !s)}
        className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
      >
        <Languages className="w-3 h-3" />
        {showOriginal ? t('community.show_translation') : t('community.show_original')}
      </button>
    </div>
  );
}