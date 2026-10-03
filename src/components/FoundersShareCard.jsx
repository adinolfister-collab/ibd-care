import React from 'react';
import { Share2, TrendingUp } from 'lucide-react';
import ShareMenu from '@/components/ShareMenu';
import { SITE_BASE } from '@/lib/seo';
import { useI18n } from '@/lib/i18n';

// "Share to climb the ranking" card shown to a joined Founder. Pre-loads the
// existing ShareMenu with a personal referral URL (/founders?ref=USER_ID) so
// every signup coming through the link increments the founder's referral_count.
export default function FoundersShareCard({ userId }) {
  const { t } = useI18n();
  const refUrl = `${SITE_BASE}/founders?ref=${userId}`;

  return (
    <div className="rounded-2xl border-2 border-terracotta/50 bg-gradient-to-br from-terracotta/10 to-accent/30 p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="w-9 h-9 rounded-xl bg-terracotta/15 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-terracotta" />
        </span>
        <div>
          <p className="font-heading font-semibold text-foreground text-sm">
            {t('founders.share_title')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t('founders.share_desc')}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 mt-3">
        <code className="text-[11px] text-muted-foreground bg-card/60 border border-border rounded-lg px-2 py-1 truncate max-w-[60%]">
          {refUrl}
        </code>
        <ShareMenu
          variant="labeled"
          shareUrl={refUrl}
          title={t('founders.share_title')}
          summary={t('founders.share_summary')}
          label={
            <span className="inline-flex items-center gap-1.5">
              <Share2 className="w-4 h-4" />
              {t('founders.share_btn')}
            </span>
          }
        />
      </div>
    </div>
  );
}