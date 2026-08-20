import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Loader2, CreditCard, CalendarClock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';

export default function SubscriptionCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [subscription, setSubscription] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await base44.functions.invoke('getSubscriptionStatus', {});
      if (res.data?.status) setSubscription(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') setStatus('success');
    if (params.get('checkout') === 'cancel') setStatus('cancel');
    fetchStatus();
  }, []);

  const subscribe = async () => {
    // Block checkout inside the builder preview iframe
    if (window.self !== window.top) {
      setError('Il checkout funziona solo dall\'app pubblicata. Pubblica l\'app e aprila in una nuova scheda per abbonarti.');
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

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gradient-to-br from-primary to-primary/80 px-5 py-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" />
            <p className="font-semibold text-lg">IBD Care Premium</p>
          </div>
          <p className="text-primary-foreground/90 text-sm leading-relaxed">Tutte le funzionalità dell'app con 1 mese di prova gratuita.</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">€1,99</span>
            <span className="text-muted-foreground">/ mese</span>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Diario sintomi e alimentare illimitati</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Assistente AI e analisi trend personalizzati</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Modello pasti e lista cibi tollerati/sconsigliati</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Riepilogo PDF con grafici per il medico</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Scanner esami sanitari con confronto nel tempo</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Mappa servizi IBD, farmacie e bagni più vicini</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Promemoria terapie e gestione farmaci</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Board community di supporto</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Backup sicuro e protezione dati (GDPR)</li>
          </ul>

          <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-sm text-primary">
            <CalendarClock className="w-4 h-4 shrink-0" />
            <span><strong>1 mese gratuito</strong> — nessun addebito per i primi 30 giorni, disdici quando vuoi.</span>
          </div>

          {status === 'success' && (
            <p className="text-sm text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">Abbonamento attivato! La prova gratuita di 1 mese è iniziata.</p>
          )}
          {status === 'cancel' && (
            <p className="text-sm text-muted-foreground bg-accent rounded-xl px-3 py-2">Pagamento annullato. Puoi abbonarti in qualsiasi momento.</p>
          )}
          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>}

          {subscription && (subscription.status === 'trialing' || subscription.status === 'active') ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-emerald-700">
                {subscription.status === 'trialing' ? 'Prova gratuita attiva' : 'Abbonamento Premium attivo'}
              </p>
              {subscription.status === 'trialing' && subscription.trialRemaining > 0 && (
                <p className="text-sm text-emerald-700">Mancano {subscription.trialRemaining} giorni alla fine della prova gratuita.</p>
              )}
              {subscription.cancelAtPeriodEnd && (
                <p className="text-xs text-muted-foreground">Disdetto: scade al termine del periodo corrente.</p>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={subscribe}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {loading ? 'Reindirizzamento…' : 'Abbonati con 1 mese gratuito'}
              </button>
              <p className="text-center text-xs text-muted-foreground">Pagamento sicuro tramite Stripe. Cancella in qualsiasi momento.</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}