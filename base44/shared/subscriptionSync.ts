// Shared mapping from a Stripe subscription object to the user-profile
// access-level fields. Used by getSubscriptionStatus (user-scoped updateMe)
// and handleStripeWebhook (service-role User update by email) so the two
// sync paths never diverge.

// 30-day free trial length (app-side, not Stripe-side).
export const TRIAL_DAYS = 30;

export function profileFieldsFromSubscription(sub: any) {
  if (!sub) {
    return {
      subscription_status: 'none',
      subscription_trial_end: null,
      subscription_period_end: null,
      subscription_cancel_at_period_end: false,
    };
  }
  return {
    subscription_status: sub.status || 'none',
    subscription_trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    subscription_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    subscription_cancel_at_period_end: !!sub.cancel_at_period_end,
  };
}

// Maps a Google Play Billing subscription resource (purchases.subscriptions)
// to the same user-profile fields. Play resources expose expiryTimeMillis
// and autoRenewing instead of trial_end/current_period_end.
export function profileFieldsFromPlaySubscription(res: any) {
  if (!res) {
    return {
      subscription_status: 'none',
      subscription_trial_end: null,
      subscription_period_end: null,
      subscription_cancel_at_period_end: false,
    };
  }
  const expiryTs = res.expiryTimeMillis ? Number(res.expiryTimeMillis) : null;
  const active = res.paymentState === 1 && new Date(expiryTs).getTime() > Date.now();
  return {
    subscription_status: active ? 'active' : (res.cancelReason ? 'canceled' : 'none'),
    subscription_trial_end: null,
    subscription_period_end: expiryTs ? new Date(expiryTs).toISOString() : null,
    subscription_cancel_at_period_end: res.autoRenewing === false,
  };
}