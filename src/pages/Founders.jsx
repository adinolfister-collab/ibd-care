import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Trophy, Users, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useFoundersRanking, clearFoundersCache } from '@/hooks/useFoundersRanking';
import { useToast } from '@/components/ui/use-toast';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Founders() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { isAuthenticated, authChecked } = useAuth();
  const { data, loading, reload } = useFoundersRanking();
  const [joining, setJoining] = useState(false);

  const counts = data?.counts;
  const mySignup = data?.mySignup;
  const ranking = data?.ranking || [];

  const join = async () => {
    if (joining) return;
    setJoining(true);
    try {
      const res = await base44.functions.invoke('joinFoundersCampaign', {});
      if (res.data?.full) {
        toast({ title: t('founders.full_total') });
      } else if (res.data?.joined) {
        clearFoundersCache();
        await reload();
        if (res.data?.confirmed) {
          const isLife = res.data?.slot_type === 'lifetime';
          toast({ title: (isLife ? t('founders.confirm_toast') : t('founders.confirm_toast_three')).replace('{n}', res.data.rank || '') });
        } else {
          toast({ title: t('founders.status_pending') });
        }
      } else if (res.data?.error) {
        toast({ title: t('founders.join_error'), variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: t('founders.join_error'), variant: 'destructive' });
    } finally {
      setJoining(false);
    }
  };

  const myStatus = () => {
    if (!mySignup) return null;
    if (!mySignup.confirmed) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm flex items-start gap-2">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t('founders.status_pending')}</span>
        </div>
      );
    }
    const isLife = mySignup.slot_type === 'lifetime';
    return (
      <div className={cn('rounded-2xl border px-4 py-3 text-sm flex items-start gap-2', isLife ? 'border-terracotta/40 bg-terracotta/10 text-terracotta' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{(isLife ? t('founders.status_lifetime') : t('founders.status_three_months')).replace('{n}', mySignup.rank || '')}</span>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title={t('founders.title')}
          subtitle={t('founders.subtitle')}
          action={
            <span className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold uppercase tracking-[0.2em] text-terracotta">
              <Crown className="w-3.5 h-3.5" /> {t('founders.eyebrow')}
            </span>
          }
        />

        {/* Counters */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border-2 border-terracotta/60 bg-gradient-to-br from-terracotta/10 to-accent/30 p-5 text-center">
            <Crown className="w-6 h-6 text-terracotta mx-auto mb-1.5" />
            <p className="font-heading text-3xl font-semibold text-foreground">
              {loading ? '–' : `${counts?.lifetime || 0}/${counts?.lifetimeTotal || 10}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('founders.counter_lifetime')}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-1.5" />
            <p className="font-heading text-3xl font-semibold text-foreground">
              {loading ? '–' : `${counts?.confirmed || 0}/${counts?.total || 50}`}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('founders.counter_total')}</p>
          </div>
        </div>

        {/* My status / CTA */}
        <div className="mb-6 space-y-3">
          {myStatus()}
          {authChecked && isAuthenticated && !mySignup && !counts?.full && (
            <Button onClick={join} disabled={joining} size="lg" className="w-full rounded-xl bg-terracotta text-terracotta-foreground hover:bg-terracotta/90 text-base h-12">
              {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-5 h-5" />}
              {t('founders.cta_join')}
            </Button>
          )}
          {authChecked && !isAuthenticated && (
            <div className="rounded-2xl border border-border bg-accent/40 px-4 py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">{t('founders.login_required')}</p>
              <div className="flex justify-center gap-2">
                <Link to="/login"><Button className="rounded-xl">{t('founders.cta_login')}</Button></Link>
                <Link to="/register"><Button variant="outline" className="rounded-xl">{t('login.create_account')}</Button></Link>
              </div>
            </div>
          )}
          {counts?.full && (
            <div className="rounded-2xl border border-border bg-accent/40 px-4 py-3 text-center text-sm text-muted-foreground">
              {t('founders.full_total')}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <p className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-terracotta" /> {t('founders.how_title')}
          </p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><span className="text-terracotta font-heading font-semibold">1.</span><span>{t('founders.how_1')}</span></li>
            <li className="flex items-start gap-2"><span className="text-terracotta font-heading font-semibold">2.</span><span>{t('founders.how_2')}</span></li>
            <li className="flex items-start gap-2"><span className="text-terracotta font-heading font-semibold">3.</span><span>{t('founders.how_3')}</span></li>
          </ol>
        </div>

        {/* Ranking */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-accent/40">
            <Trophy className="w-4 h-4 text-terracotta" />
            <p className="font-heading font-semibold text-foreground text-sm">{t('founders.ranking_title')}</p>
            {!loading && counts && (
              <span className="ml-auto text-xs text-muted-foreground">
                {counts.lifetimeLeft > 0 ? `${counts.lifetimeLeft} ${t('founders.spots_left_lifetime')}` : `${counts.totalLeft} ${t('founders.spots_left_total')}`}
              </span>
            )}
          </div>
          {loading ? (
            <div className="px-4 py-10 text-center text-muted-foreground text-sm">{t('founders.loading')}</div>
          ) : ranking.length === 0 ? (
            <div className="px-4 py-10 text-center text-muted-foreground text-sm">{t('founders.loading')}</div>
          ) : (
            <ol className="divide-y divide-border">
              {ranking.map((r) => (
                <li key={r.rank} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-terracotta/15 text-terracotta text-sm font-heading font-semibold shrink-0">
                    {r.rank}
                  </span>
                  <span className="font-medium text-foreground text-sm flex-1 truncate">
                    {r.display_name}
                  </span>
                  <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0', r.slot_type === 'lifetime' ? 'bg-terracotta/15 text-terracotta' : 'bg-accent text-accent-foreground')}>
                    {r.slot_type === 'lifetime' ? t('founders.badge_lifetime') : t('founders.badge_three_months')}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </AppLayout>
  );
}