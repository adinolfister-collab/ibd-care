import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Shown on the free logging pages (Symptoms, Food) to unauthenticated
// visitors: entries live only on this device until they register / sign in.
export default function GuestBanner() {
  const { t } = useI18n();
  return (
    <div className="mb-4 rounded-2xl border border-terracotta/40 bg-terracotta/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-foreground">{t('guest.banner_title')}</p>
          <p className="text-muted-foreground mt-0.5 leading-relaxed">{t('guest.banner_desc')}</p>
          <Link
            to="/register"
            className="inline-flex items-center mt-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            {t('guest.banner_cta')}
          </Link>
        </div>
      </div>
    </div>
  );
}