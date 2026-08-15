import React, { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

export default function VoiceButton({ onResult, className }) {
  const { lang } = useI18n();
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  if (!SpeechRecognition) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = lang === 'en' ? 'en-US' : 'it-IT';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const txt = Array.from(e.results).map((r) => r[0].transcript).join(' ').trim();
      if (txt) onResult(txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={listening ? 'Interrompi' : 'Detta con la voce'}
      className={cn(
        'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
        listening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-accent text-accent-foreground',
        className
      )}
    >
      {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}