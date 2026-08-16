import React, { useEffect, useState } from 'react';
import { Sparkles, Check, Loader2, CreditCard, CalendarClock, LogOut, ShieldCheck, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const benefits = [
  'Diario sintomi e alimentare illimitati',
  'Assistente AI e analisi dei trend',
  'Riepilogo PDF con grafici per le visite',
  'Mappa servizi IBD e promemoria terapie',
];

// Paywall shown when an authenticated user has no active/trialing
// subscription. Replaces the page content, so all app functions are limited
// until the 14-day trial (or a paid subscription) is started.
export default function Paywall({ onSubscribed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      onSubscribed?.();
    }
  }, [onSubscribed]);

  const subscribe = async () => {
    if (window.self !== window.top) {
      setError("Il checkout funziona solo dall'app pubblicata. Pubblica l'app e aprila in una nuova scheda per abbonarti.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('createSubscriptionCheckout', {});
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError(res.data?.error || 'Impossibile avviare il checkout.');
        setLoading(false);
      }
    } catch (e) {
      setError(e.message || 'Errore di rete.');
      setLoading(false);
    }
  };

  const logout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="max-w-md mx-auto py-2">
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/80 px-5 py-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" />
            <p className="font-semibold text-lg">IBD Care Premium</p>
          </div>
          <p className="text-primary-foreground/90 text-sm leading-relaxed">
            Attiva la prova gratuita di 14 giorni per sbloccare tutte le funzioni dell'app.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">€2,99</span>
            <span className="text-muted-foreground">/ mese</span>
          </div>

          <ul className="space-y-2 text-sm">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-primary/5 px-3 py-3 text-sm text-primary space-y-1.5">
            <p className="flex items-start gap-2">
              <CalendarClock className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Prova gratuita di 14 giorni</strong></span>
            </p>
            <ul className="text-primary/80 pl-6 space-y-1 list-disc">
              <li>Nessun addebito per i primi 14 giorni dall'iscrizione.</li>
              <li>Al termine della prova si attiva l'abbonamento a €2,99/mese.</li>
              <li>Puoi disdire in qualsiasi momento prima del rinnovo.</li>
              <li>La prova gratuita è disponibile una sola volta per utente.</li>
            </ul>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Pagamento sicuro gestito da Stripe. Nessun costo nascosto.
            </p>
            <p>Senza abbonamento le funzioni dell'app restano limitate.</p>
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>}

          <button
            onClick={subscribe}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            {loading ? 'Reindirizzamento…' : 'Avvia la prova gratuita di 14 giorni'}
          </button>

          <div className="flex items-center justify-between pt-1">
            <button onClick={onSubscribed} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
              <RefreshCw className="w-3 h-3" /> Ho già un abbonamento
            </button>
            <button onClick={logout} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
              <LogOut className="w-3 h-3" /> Esci
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}