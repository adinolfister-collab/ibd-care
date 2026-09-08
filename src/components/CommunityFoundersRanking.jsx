import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useFoundersRanking } from '@/hooks/useFoundersRanking';

// Compact Founder ranking shown at the top of the Community page (visible
// to everyone, including visitors). Links to the full /founders page.
export default function CommunityFoundersRanking() {
  const { t } = useI18n();
  const { data, loading } = useFoundersRanking();
  if (loading) return null;
  const ranking = (data?.ranking || []).slice(0, 5);
  if (ranking.length === 0) return null;
  return (
    <div className="mb-5 rounded-2xl border border-terracotta/40 bg-gradient-to-r from-primary/5 to-accent/30 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-terracotta" />
          <p className="font-heading font-semibold text-sm text-foreground">{t('founders.community_section_title')}</p>
        </div>
        <Link to="/founders" className="inline-flex items-center gap-1 text-xs text-terracotta font-medium hover:underline">
          {t('founders.community_view_all')} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <ol className="space-y-1.5">
        {ranking.map((r) => (
          <li key={r.rank} className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-terracotta/15 text-terracotta text-xs font-heading font-semibold shrink-0">
              {r.rank}
            </span>
            <span className="font-medium text-foreground truncate flex-1">
              {r.display_name}{r.is_me && <span className="text-muted-foreground"> ({t('founders.you')})</span>}
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${r.slot_type === 'lifetime' ? 'bg-terracotta/15 text-terracotta' : 'bg-accent text-accent-foreground'}`}>
              {r.slot_type === 'lifetime' ? t('founders.slot_lifetime') : t('founders.slot_three_months')}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}