import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

const SpeechSynthesis =
  typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;

const LANG_MAP = {
  it: 'it-IT',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
};

// Rimuove la sintassi markdown per una lettura vocale naturale.
function stripMarkdown(text = '') {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#>~|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Modalità conversazione: parla -> il testo va inviato in automatico ->
// la risposta dell'assistente viene letta ad alta voce -> si riprende
// l'ascolto per il turno successivo. Toggle parallelo alla scrittura.
export default function VoiceConversation({
  lang,
  labels,
  onTranscript,
  assistantContent,
  assistantContentId,
}) {
  const supported = !!(SpeechRecognition && SpeechSynthesis);
  const [active, setActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const recRef = useRef(null);
  const modeRef = useRef(false);
  const awaitingRef = useRef(false);
  const spokenIdRef = useRef(null);
  const restartTimerRef = useRef(null);

  const langCode = (l) => LANG_MAP[l] || 'it-IT';

  const stopRecognition = useCallback(() => {
    try { recRef.current?.stop(); } catch (_) {}
    recRef.current = null;
    setListening(false);
  }, []);

  const cancelSpeech = useCallback(() => {
    try { SpeechSynthesis?.cancel(); } catch (_) {}
    setSpeaking(false);
  }, []);

  const startRecognition = useCallback(() => {
    if (!supported || !modeRef.current) return;
    // evita doppi start
    if (recRef.current) return;
    const rec = new SpeechRecognition();
    rec.lang = langCode(lang);
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (e) => {
      const txt = Array.from(e.results)
        .filter((r) => r.isFinal)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();
      if (txt) {
        awaitingRef.current = true;
        stopRecognition();
        onTranscript(txt);
      }
    };
    rec.onend = () => { setListening(false); };
    rec.onerror = () => { setListening(false); };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch (_) { setListening(false); }
  }, [supported, lang, onTranscript, stopRecognition]);

  const toggle = () => {
    if (!supported) return;
    const next = !active;
    setActive(next);
    modeRef.current = next;
    if (next) {
      startRecognition();
    } else {
      awaitingRef.current = false;
      stopRecognition();
      cancelSpeech();
    }
  };

  // cleanup al mktime smontaggio
  useEffect(() => {
    return () => {
      clearTimeout(restartTimerRef.current);
      stopRecognition();
      cancelSpeech();
    };
  }, [stopRecognition, cancelSpeech]);

  // Leggi la risposta dell'assistente quando cambia e la modalità è attiva.
  useEffect(() => {
    if (!active || !assistantContent || !assistantContentId) return;
    if (spokenIdRef.current === assistantContentId) return;
    spokenIdRef.current = assistantContentId;

    stopRecognition();
    if (!SpeechSynthesis) {
      awaitingRef.current = false;
      return;
    }
    SpeechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(stripMarkdown(assistantContent));
    u.lang = langCode(lang);
    u.onstart = () => setSpeaking(true);
    u.onend = () => {
      setSpeaking(false);
      awaitingRef.current = false;
      if (modeRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => startRecognition(), 250);
      }
    };
    u.onerror = () => {
      setSpeaking(false);
      awaitingRef.current = false;
      if (modeRef.current) startRecognition();
    };
    SpeechSynthesis.speak(u);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantContentId, active]);

  const status = speaking
    ? labels.speaking
    : listening
    ? labels.listening
    : active
    ? labels.mode
    : labels.mode;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors',
        active
          ? 'border-terracotta/60 bg-terracotta/10'
          : 'border-border bg-accent/40'
      )}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={!supported}
        title={supported ? labels.mode : labels.unsupported}
        aria-pressed={active}
        className={cn(
          'shrink-0 flex items-center justify-center rounded-full transition-all',
          'min-h-[48px] min-w-[48px] h-12 w-12',
          !supported && 'opacity-50 cursor-not-allowed',
          active
            ? listening
              ? 'bg-destructive text-destructive-foreground animate-pulse'
              : speaking
              ? 'bg-primary text-primary-foreground'
              : 'bg-terracotta text-terracotta-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {!supported ? (
          <MicOff className="w-5 h-5" />
        ) : speaking ? (
          <Volume2 className="w-5 h-5" />
        ) : active ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      <div className="min-w-0">
        <p className="font-heading text-sm font-semibold text-primary leading-tight truncate">
          {labels.mode}
        </p>
        <p
          className={cn(
            'text-xs leading-tight truncate',
            speaking ? 'text-primary' : listening ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {!supported ? labels.unsupported : status}
        </p>
      </div>
    </div>
  );
}