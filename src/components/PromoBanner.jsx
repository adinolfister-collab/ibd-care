import React from 'react';
import { CalendarClock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';

// Reminds logged-in users in the 14-day free trial of the days remaining.
export default function PromoBanner() {
  const { t } = useI18n();
  const { data, loading } = useSubscription();
  if (loading || !data || data.status !== 'promo') return null;
  const days = data.promoDaysRemaining;
  const dayWord = days === 1 ? t('promo.day_one') : t('promo.day_many');
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-primary">
      <CalendarClock className="w-5 h-5 shrink-0" />
      <p className="text-sm leading-snug">
        <strong className="font-semibold">{t('promo.trial_title')}</strong> — {t('promo.trial_days').replace('{n}', days).replace('{days}', dayWord)}
      </p>
    </div>
  );
}