import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

const LANG_MAP = {
  it: 'it-IT',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
};

// Microfono a toggle: un tocco avvia l'ascolto, un altro tocco ferma e
// invia subito la trascrizione. Niente TTS, niente ciclo di riavvio.
export default function MicToggle({ lang, onTranscript }) {
  const { t } = useI18n();
  const supported = !!SpeechRecognition;
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const transcriptRef = useRef('');

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch (_) {}
  }, []);

  const start = useCallback(() => {
    if (!supported) return;
    transcriptRef.current = '';
    const rec = new SpeechRecognition();
    rec.lang = LANG_MAP[lang] || 'it-IT';
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (e) => {
      const txt = Array.from(e.results)
        .filter((r) => r.isFinal)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();
      if (txt) transcriptRef.current += (transcriptRef.current ? ' ' : '') + txt;
    };
    rec.onend = () => {
      const final = transcriptRef.current.trim();
      recRef.current = null;
      setListening(false);
      if (final) onTranscript(final);
    };
    rec.onerror = () => {
      recRef.current = null;
      setListening(false);
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (_) {
      setListening(false);
    }
  }, [supported, lang, onTranscript]);

  const toggle = () => {
    if (!supported) return;
    if (listening) stop();
    else start();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!supported}
      title={
        !supported
          ? t('assistant.voice_unsupported')
          : listening
          ? t('assistant.voice_listening')
          : t('assistant.voice_listening')
      }
      aria-pressed={listening}
      className={cn(
        'shrink-0 flex items-center justify-center rounded-xl transition-colors min-h-[48px] min-w-[48px] h-12 w-12',
        !supported
          ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
          : listening
          ? 'bg-terracotta text-terracotta-foreground animate-pulse'
          : 'bg-primary text-primary-foreground'
      )}
    >
      {!supported ? (
        <MicOff className="w-5 h-5" />
      ) : listening ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
}