import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import ShareMenu from '@/components/ShareMenu';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Users, CalendarPlus, Check, Loader2, Link2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SITE_BASE } from '@/lib/seo';

// Milestone: +7 / +7 / +30 (mese omaggio al terzo amico). Totale max +44.
const BONUS_SCHEDULE = [7, 7, 30];
const MAX_REFERRALS = BONUS_SCHEDULE.length;
const INVITEE_DAYS = 45;
const sumSchedule = (arr) => arr.reduce((a, b) => a + b, 0);

export default function Invita() {
  const { t } = useI18n();
  const { isAuthenticated, authChecked } = useAuth();
  const [user, setUser] = useState(null);
  const [signup, setSignup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authChecked) return;
      if (!isAuthenticated) { if (!cancelled) setLoading(false); return; }
      try {
        const me = await base44.auth.me();
        if (cancelled) return;
        setUser(me);
        const all = await base44.entities.CampaignSignup.filter({ campaign: 'invite_a_friend' }, '-created_date', 50);
        if (cancelled) return;
        setSignup(all.find((s) => s.created_by_id === me.id) || null);
      } catch (e) { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [authChecked, isAuthenticated]);

  const referralCount = Math.min(signup?.referral_count || 0, MAX_REFERRALS);
  const daysEarned = sumSchedule(BONUS_SCHEDULE.slice(0, referralCount));
  const daysLeft = sumSchedule(BONUS_SCHEDULE.slice(referralCount));
  const maxReached = referralCount >= MAX_REFERRALS;

  const refUrl = user ? `${SITE_BASE}/?ref=${user.id}` : '';
  const shareText = t('invite.share_text');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(refUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      try { base44.analytics.track({ eventName: 'referral_link_shared' }); } catch (e) { /* noop */ }
    } catch (e) {}
  };

  const handleShareClick = () => {
    try { base44.analytics.track({ eventName: 'referral_link_shared' }); } catch (e) { /* noop */ }
  };

  if (!authChecked || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title={t('invite.page_title')} subtitle={t('invite.page_subtitle')} />

      {!isAuthenticated ? (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-terracotta/10 to-accent/40">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-terracotta/20 flex items-center justify-center">
              <Gift className="w-7 h-7 text-terracotta" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {t('invite.guest_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button className="w-full sm:w-auto">{t('invite.cta_register')}</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="w-full sm:w-auto">{t('invite.cta_login')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Link referral personalizzato */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-terracotta/10 to-accent/40">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-terracotta" />
                <span className="font-heading text-sm font-semibold uppercase tracking-wide text-terracotta">
                  {t('invite.your_link')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {t('invite.link_hint')}
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border">
                <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate flex-1" data-selectable>{refUrl}</span>
                <Button size="sm" onClick={copyLink} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 mr-1" /> : null}
                  {copied ? t('invite.copied') : t('invite.copy')}
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-3" onClick={handleShareClick}>
                <span className="text-xs text-muted-foreground">{t('invite.share_now')}</span>
                <ShareMenu variant="inline" shareUrl={refUrl} title={t('invite.page_title')} summary={shareText} />
              </div>
            </CardContent>
          </Card>

          {/* Progresso referral */}
          <Card className="border border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-heading text-lg font-semibold">{t('invite.progress_title')}</h2>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <Stat value={`${referralCount}/${MAX_REFERRALS}`} label={t('invite.friends_invited')} />
                <Stat value={`+${daysEarned}`} label={t('invite.days_earned')} />
                <Stat value={maxReached ? t('invite.maxed') : `+${daysLeft}`} label={t('invite.days_left')} />
              </div>
              {/* Barra progresso */}
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-terracotta rounded-full transition-all"
                  style={{ width: `${Math.min(referralCount / MAX_REFERRALS, 1) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                {maxReached ? t('invite.maxed_hint') : t('invite.progress_hint').replace('{n}', (MAX_REFERRALS - referralCount))}
              </p>
            </CardContent>
          </Card>

          {/* Come funziona */}
          <Card className="border border-border shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-heading text-lg font-semibold mb-4">{t('invite.how_title')}</h2>
              <ol className="space-y-4">
                <Step n="1" icon={Link2} title={t('invite.step1_title')} desc={t('invite.step1_desc')} />
                <Step n="2" icon={Users} title={t('invite.step2_title')} desc={t('invite.step2_desc').replace('{days}', INVITEE_DAYS)} />
                <Step n="3" icon={CalendarPlus} title={t('invite.step3_title').replace('{max}', sumSchedule(BONUS_SCHEDULE))} desc={t('invite.step3_desc').replace('{bonus1}', BONUS_SCHEDULE[0]).replace('{milestone}', BONUS_SCHEDULE[2]).replace('{max}', sumSchedule(BONUS_SCHEDULE))} />
              </ol>
            </CardContent>
          </Card>

          {/* T&C brevi */}
          <div className="p-4 rounded-xl bg-accent/50">
            <p className="text-xs text-muted-foreground leading-relaxed" data-selectable>
              {t('invite.terms')}
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-center p-3 rounded-xl bg-muted/40">
      <p className="text-2xl font-heading font-semibold text-terracotta">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function Step({ n, icon: Icon, title, desc }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-terracotta/15 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-terracotta" />
      </div>
      <div>
        <p className="font-medium leading-snug">{title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
      </div>
    </li>
  );
}