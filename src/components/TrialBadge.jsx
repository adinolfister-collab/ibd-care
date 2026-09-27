import React from 'react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';

// Compact countdown badge shown in the header while the 30-day trial is
// active. Hidden once the user subscribes or the trial expires.
export default function TrialBadge() {
  const { t } = useI18n();
  const { isTrialing, trialRemaining } = useSubscription();
  if (!isTrialing || !trialRemaining) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/15 text-terracotta px-2 py-0.5 text-[0.65rem] font-semibold whitespace-nowrap">
      <Sparkles className="w-3 h-3" />
      {t('trial.badge', { n: trialRemaining }).replace('{n}', trialRemaining)}
    </span>
  );
}