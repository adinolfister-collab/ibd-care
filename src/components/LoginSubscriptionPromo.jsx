import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, CalendarClock, ShieldCheck } from 'lucide-react';

const benefits = [
  'Diario sintomi e alimentare illimitati',
  'Assistente AI e analisi dei trend',
  'Riepilogo PDF con grafici per le visite',
  'Scanner esami sanitari con confronto e PDF',
  'Mappa servizi IBD e promemoria terapie',
];

// Informational subscription / 14-day trial panel shown on the login page
// (no checkout here — the user isn't authenticated yet).
export default function LoginSubscriptionPromo({ returnTo = '/' }) {
  const registerTo = '/register' + (returnTo && returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : '');
  return (
    <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="font-semibold text-primary">IBD Care Premium · 1 mese gratuito</p>
      </div>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        Creando un account si attiva automaticamente una prova gratuita di 1 mese: nessun addebito per i primi 30 giorni, poi €1,99/mese. Disdici quando vuoi.
      </p>
      <ul className="space-y-1.5 text-sm mb-3">
        {benefits.map((b) => (
          <li key={b} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted-foreground space-y-1.5 mb-4">
        <p className="flex items-start gap-1.5">
          <CalendarClock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          La prova è legata al tuo account ed è disponibile una sola volta per utente.
        </p>
        <p className="flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Senza abbonamento le funzioni dell'app restano limitate.
        </p>
      </div>
      <Link
        to={registerTo}
        className="inline-flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Crea un account con prova gratuita
      </Link>
    </div>
  );
}