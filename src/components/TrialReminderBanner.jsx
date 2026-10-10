import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Hourglass, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

// Banner compatto mostrato a ogni accesso agli utenti registrati senza Premium:
// prova attiva -> giorni rimasti; prova scaduta -> Premium richiesto.
export default function TrialReminderBanner() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const { loading, status, isTrialing, trialRemaining } = useSubscription();

  if (!isAuthenticated || loading) return null;
  if (status === 'active') return null;
  if (status === 'trialing' && !trialRemaining) return null;

  const expired = !isTrialing;
  const Icon = expired ? Crown : Hourglass;
  const text = expired
    ? t('trial.banner_expired')
    : t('trial.banner_active').replace('{n}', trialRemaining);

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-terracotta/40 bg-gradient-to-r from-primary/5 to-accent/40 px-4 py-2.5">
      <span className="shrink-0 inline-flex w-8 h-8 items-center justify-center rounded-full bg-terracotta/15">
        <Icon className="w-4 h-4 text-terracotta" />
      </span>
      <p className="flex-1 text-xs md:text-sm text-foreground/85 leading-snug">{text}</p>
      <Link
        to="/abbonamento"
        className="shrink-0 inline-flex items-center gap-1 text-xs md:text-sm font-medium text-terracotta hover:underline underline-offset-2"
      >
        {t('trial.cta_subscribe')}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}