import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// Banner compatto per la pagina di login: stato della prova gratuita,
// senza l'elenco delle funzioni Premium. Sostituisce LoginSubscriptionPromo
// solo sul login (la pagina /abbonamento continua a usare il promo esteso).
export default function LoginTrialBanner({ returnTo = '/' }) {
  const registerTo =
    '/register' + (returnTo && returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : '');
  return (
    <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="font-semibold text-primary text-sm">IBD Care Premium · 1 mese gratuito</p>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[16rem]">
          Registrandoti si attiva una prova gratuita di 30 giorni, poi €1,99/mese. Disdici quando vuoi.
        </p>
        <Link
          to={registerTo}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          Crea un account
        </Link>
      </div>
    </div>
  );
}