import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
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
  ru: 'ru-RU',
  pl: 'pl-PL',
  ro: 'ro-RO',
  sq: 'sq-AL',
  zh: 'zh-CN',
};

// Microfono a toggle: un tocco avvia l'ascolto, un altro tocco ferma e
// invia la trascrizione. L'ascolto sopravvive alle pause di silenzio
// perché il browser viene riavviato automaticamente finché l'utente
// non preme stop manualmente.
export default function MicToggle({ lang, onTranscript, onListeningChange }) {
  const { t } = useI18n();
  const supported = !!SpeechRecognition;
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const transcriptRef = useRef('');
  const manualStopRef = useRef(false);
  const restartTimerRef = useRef(null);

  // Mantieni sempre l'ultima callback senza forzare ricostruzioni del riconoscitore
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  const onListeningChangeRef = useRef(onListeningChange);
  useEffect(() => { onListeningChangeRef.current = onListeningChange; }, [onListeningChange]);

  const setListeningSafe = useCallback((v) => {
    setListening(v);
    onListeningChangeRef.current?.(v);
  }, []);

  const buildRec = useCallback(() => {
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
      recRef.current = null;
      if (manualStopRef.current) {
        const final = transcriptRef.current.trim();
        transcriptRef.current = '';
        setListeningSafe(false);
        if (final) onTranscriptRef.current(final);
        return;
      }
      // Pausa di silenzio: riavvia con un piccolo ritardo per restare in
      // ascolto finché l'utente non ferma manualmente.
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = setTimeout(() => {
        if (manualStopRef.current) { setListeningSafe(false); return; }
        try {
          const next = buildRec();
          recRef.current = next;
          next.start();
        } catch (_) {
          setListeningSafe(false);
        }
      }, 250);
    };

    rec.onerror = (e) => {
      // 'no-speech' e 'aborted' sono normali durante l'ascolto continuo:
      // lascia che onend gestisca il riavvio.
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        manualStopRef.current = true;
        setListeningSafe(false);
      }
    };

    return rec;
  }, [lang, setListeningSafe]);

  const start = useCallback(() => {
    if (!supported) return;
    manualStopRef.current = false;
    transcriptRef.current = '';
    try {
      const rec = buildRec();
      recRef.current = rec;
      rec.start();
      setListeningSafe(true);
    } catch (_) {
      setListeningSafe(false);
    }
  }, [supported, buildRec, setListeningSafe]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    clearTimeout(restartTimerRef.current);
    try { recRef.current?.stop(); } catch (_) {}
    // Alcuni browser non emettono onend se non c'era audio: fallback di invio
    setTimeout(() => {
      if (!recRef.current) return;
      const final = transcriptRef.current.trim();
      transcriptRef.current = '';
      recRef.current = null;
      setListeningSafe(false);
      if (final) onTranscriptRef.current(final);
    }, 300);
  }, [setListeningSafe]);

  const toggle = () => {
    if (!supported) return;
    if (listening) stop();
    else start();
  };

  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      clearTimeout(restartTimerRef.current);
      try { recRef.current?.stop(); } catch (_) {}
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!supported}
      title={
        !supported
          ? t('assistant.voice_unsupported')
          : listening
          ? t('assistant.voice_stop')
          : t('assistant.voice_start')
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
        <Mic className="w-5 h-5" />
      ) : listening ? (
        <Square className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
}