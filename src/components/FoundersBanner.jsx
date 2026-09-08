import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useFoundersRanking } from '@/hooks/useFoundersRanking';

// Compact campaign banner for home / login / abbonamento. Shows the live
// lifetime-spots counter and links to the dedicated /founders page.
export default function FoundersBanner() {
  const { t } = useI18n();
  const { data, loading } = useFoundersRanking();
  const left = data?.counts?.lifetimeLeft;
  return (
    <Link
      to="/founders"
      className="group block rounded-2xl border-2 border-terracotta/70 bg-gradient-to-br from-primary/5 to-accent/40 p-4 md:p-5 transition-colors hover:from-primary/10"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-terracotta/15 flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-terracotta" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-foreground text-sm md:text-base">{t('founders.banner_title')}</p>
          <p className="text-xs md:text-sm text-muted-foreground leading-snug">
            {t('founders.banner_desc')}
            {!loading && typeof left === 'number' && left > 0 && (
              <span className="text-terracotta font-medium"> · {left} {t('founders.spots_left_lifetime')}</span>
            )}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-terracotta group-hover:translate-x-0.5 transition-transform shrink-0" />
      </div>
    </Link>
  );
}