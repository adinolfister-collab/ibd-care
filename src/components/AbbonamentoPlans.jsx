import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, Loader2, CreditCard, Crown, Settings, Lock, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { clearSubscriptionCache } from '@/hooks/useSubscription';
import { isPlayBillingAvailable, launchPlayBilling } from '@/lib/playBilling';
import { cn } from '@/lib/utils';

// Plans shown on the Abbonamento page. Checkout routes to Google Play Billing
// when the native bridge is present (Android build), otherwise to Stripe web
// checkout. The 30-day trial is app-side, so this UI surfaces the trial
// countdown and the expired (read-only) state.
export default function AbbonamentoPlans() {
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [manageLoading, setManageLoading] = useState(false);
  const playAvailable = isPlayBillingAvailable();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') { setStatus('success'); clearSubscriptionCache(); }
    if (params.get('checkout') === 'cancel') setStatus('cancel');
    (async () => {
      try {
        const res = await base44.functions.invoke('getSubscriptionStatus', {});
        if (res.data?.status) setSubscription(res.data);
      } catch (e) {}
    })();
  }, []);

  const isActive = subscription && ['active', 'trialing'].includes(subscription.status);
  const isExpired = subscription?.status === 'expired';
  const isTrialing = subscription?.status === 'trialing';

  const subscribe = async (plan) => {
    setError('');
    setLoading(plan);
    try {
      if (playAvailable) {
        const data = await launchPlayBilling(plan);
        if (data?.status === 'active') {
          setStatus('success');
          clearSubscriptionCache();
          navigate('/abbonamento?checkout=success');
          return;
        }
        throw new Error(data?.error || t('premium.checkout_error'));
      }
      // Stripe web fallback
      const isFramed = window.self !== window.top;
      const checkoutTab = isFramed ? window.open('', '_blank') : null;
      if (isFramed && !checkoutTab) throw new Error('Allow popups to continue to checkout.');
      if (checkoutTab) checkoutTab.opener = null;
      try {
        const res = await base44.functions.invoke('createSubscriptionCheckout', { plan });
        if (!res.data?.url) throw new Error(res.data?.error || t('premium.checkout_error'));
        if (checkoutTab) {
          checkoutTab.location.replace(res.data.url);
          setLoading(null);
        } else {
          window.location.assign(res.data.url);
        }
      } catch (err) {
        checkoutTab?.close();
        throw err;
      }
    } catch (e) {
      setError(e.message || t('premium.checkout_error'));
      setLoading(null);
    }
  };

  const manage = async () => {
    setManageLoading(true);
    setError('');
    const isFramed = window.self !== window.top;
    const tab = isFramed ? window.open('', '_blank') : null;
    if (tab) tab.opener = null;
    try {
      const res = await base44.functions.invoke('createBillingPortalSession', {});
      if (!res.data?.url) throw new Error(res.data?.error || t('premium.checkout_error'));
      if (tab) {
        tab.location.replace(res.data.url);
        setManageLoading(false);
      } else {
        window.location.assign(res.data.url);
      }
    } catch (e) {
      tab?.close();
      setError(e.message || t('premium.checkout_error'));
      setManageLoading(false);
    }
  };

  const plans = [
    { id: 'monthly', price: '€4,99', period: t('premium.per_month'), badge: null, compareAt: null, featured: false },
    { id: 'yearly', price: '€49,99', period: t('premium.per_year'), badge: t('premium.save_badge'), compareAt: '€59,88', featured: true },
  ];

  const features = [
    t('premium.f_diary'),
    t('premium.f_ai'),
    t('premium.f_templates'),
    t('premium.f_pdf'),
    t('premium.f_scanner'),
    t('premium.f_import'),
    t('premium.f_map'),
    t('premium.f_therapy'),
    t('premium.f_community'),
  ];

  return (
    <div className="space-y-4">
      {/* Trial countdown banner */}
      {isTrialing && (
        <div className="rounded-2xl border border-terracotta/40 bg-terracotta/[0.07] px-4 py-3 flex items-center gap-3">
          <Clock className="w-5 h-5 text-terracotta shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {t('trial.during_title', { n: subscription?.trialRemaining ?? 0 }).replace('{n}', String(subscription?.trialRemaining ?? 0))}
            </p>
            <p className="text-xs text-muted-foreground leading-snug">{t('trial.during_hint')}</p>
          </div>
        </div>
      )}
      {/* Expired / read-only banner */}
      {isExpired && (
        <div className="rounded-2xl border border-terracotta/40 bg-terracotta/[0.07] px-4 py-3 flex items-center gap-3">
          <Lock className="w-5 h-5 text-terracotta shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('trial.expired_title')}</p>
            <p className="text-xs text-muted-foreground leading-snug">{t('trial.expired_desc')}</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <p className="text-sm text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">{t('premium.success')}</p>
      )}
      {status === 'cancel' && (
        <p className="text-sm text-muted-foreground bg-accent rounded-xl px-3 py-2">{t('premium.cancel')}</p>
      )}
      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</p>}

      {isActive && !isTrialing ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
            <Crown className="w-4 h-4" /> {t('premium.active_title')}
          </p>
          {subscription.cancelAtPeriodEnd && (
            <p className="text-xs text-muted-foreground">{t('premium.cancelled_note')}</p>
          )}
          {!playAvailable && (
            <button
              onClick={manage}
              disabled={manageLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-emerald-300 text-emerald-700 bg-card hover:bg-emerald-50 transition-colors disabled:opacity-60"
            >
              {manageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              {manageLoading ? t('premium.redirecting') : t('premium.manage_subscription')}
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-center text-sm text-muted-foreground">{t('trial.tagline')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col',
                  plan.featured ? 'border-terracotta ring-1 ring-terracotta/30' : 'border-border'
                )}
              >
                <div className={cn('px-5 py-4', plan.featured ? 'bg-terracotta/10' : 'bg-accent/40')}>
                  <div className="flex items-center justify-between">
                    <p className="font-heading font-semibold text-foreground">
                      {plan.id === 'monthly' ? t('premium.monthly') : t('premium.yearly')}
                    </p>
                    {plan.badge && (
                      <span className="text-[0.65rem] font-semibold uppercase tracking-wide bg-terracotta text-terracotta-foreground px-2 py-0.5 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    {plan.compareAt && (
                      <span className="text-base text-muted-foreground line-through">{plan.compareAt}</span>
                    )}
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <ul className="space-y-2 text-sm flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => subscribe(plan.id)}
                    disabled={loading !== null}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-base font-semibold transition-colors disabled:opacity-60 mt-4',
                      plan.featured
                        ? 'bg-terracotta text-terracotta-foreground hover:bg-terracotta/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    {loading === plan.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                    {loading === plan.id ? t('premium.redirecting') : t('premium.cta_subscribe')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="text-center text-xs text-muted-foreground">
        {playAvailable ? t('premium.play_billing_note') : t('premium.web_checkout_note')}
      </p>
      <p className="text-center text-xs text-muted-foreground">{t('premium.footer')}</p>
    </div>
  );
}