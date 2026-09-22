import React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Placeholder shown in place of a Premium-gated feature (e.g. exam scanner /
// document import) for free users. The unlock button opens the paywall.
export default function PremiumLockedCard({ onUnlock }) {
  const { t } = useI18n();
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-terracotta/15 text-terracotta flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-primary">{t('premium.title')}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">{t('premium.desc')}</p>
        <Button onClick={onUnlock} className="mt-4 rounded-xl">
          <Sparkles className="w-4 h-4 mr-1.5" /> {t('premium.cta')}
        </Button>
      </CardContent>
    </Card>
  );
}