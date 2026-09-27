import React from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';

// Non-blocking overlay. Messaging adapts to the gate reason: still in trial
// but hitting a premium-only feature, trial expired (read-only), or no trial
// yet (web visitor / unauthenticated).
export default function PremiumPaywall({ open, onClose }) {
  const { t } = useI18n();
  const { isExpired, isTrialing, trialRemaining } = useSubscription();
  if (!open) return null;

  const title = isExpired ? t('trial.expired_title') : (isTrialing ? t('premium.title') : t('premium.title'));
  const desc = isExpired
    ? t('trial.expired_desc')
    : (isTrialing
        ? t('trial.during_desc', { n: trialRemaining }).replace('{n}', trialRemaining)
        : t('premium.desc'));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 md:p-8 text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-accent text-muted-foreground"
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-terracotta/15 text-terracotta flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="font-heading text-2xl font-semibold text-primary tracking-tight">
          {title}
        </h2>
        <div className="h-px bg-terracotta/70 mx-auto my-3 w-12" />
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {desc}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mt-5 justify-center">
          <Link to="/abbonamento" className="flex-1" onClick={onClose}>
            <Button className="w-full rounded-xl h-11">{t('trial.cta_subscribe')}</Button>
          </Link>
          <Button variant="outline" className="rounded-xl h-11" onClick={onClose}>
            {t('premium.later')}
          </Button>
        </div>
      </div>
    </div>
  );
}