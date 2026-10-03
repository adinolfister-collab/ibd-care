import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const BENEFIT_KEYS = [
  'premium.f_diary',
  'premium.f_ai',
  'premium.f_pdf',
  'premium.f_scanner',
  'premium.f_map',
];

// Informational subscription panel shown on the Abbonamento page for visitors
// who are not logged in yet. Freemium model: the diary is free forever, Premium
// unlocks AI assistant and PDF reports from €4.99/month.
export default function LoginSubscriptionPromo({ returnTo = '/' }) {
  const { t } = useI18n();
  const registerTo = '/register' + (returnTo && returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : '');
  return (
    <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="font-semibold text-primary">{t('loginpromo.title')}</p>
      </div>
      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
        {t('loginpromo.desc')}
      </p>
      <ul className="space-y-1.5 text-sm mb-3">
        {BENEFIT_KEYS.map((k) => (
          <li key={k} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary shrink-0" />
            <span>{t(k)}</span>
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted-foreground space-y-1.5 mb-4">
        <p className="flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {t('loginpromo.note_free')}
        </p>
      </div>
      <Link
        to={registerTo}
        className="inline-flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t('loginpromo.cta')}
      </Link>
    </div>
  );
}