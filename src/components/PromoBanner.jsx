import React from 'react';
import { CalendarClock } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

// Reminds logged-in users in the 1-month free promo of the days remaining.
export default function PromoBanner() {
  const { data, loading } = useSubscription();
  if (loading || !data || data.status !== 'promo') return null;
  const days = data.promoDaysRemaining;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-primary">
      <CalendarClock className="w-5 h-5 shrink-0" />
      <p className="text-sm leading-snug">
        <strong className="font-semibold">Prova gratuita</strong> — ti restano {days} {days === 1 ? 'giorno' : 'giorni'} di accesso libero a tutti i moduli. Dopo, €1,99/mese.
      </p>
    </div>
  );
}