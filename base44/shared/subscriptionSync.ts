// Shared mapping from a Stripe subscription object to the user-profile
// access-level fields. Used by getSubscriptionStatus (user-scoped updateMe)
// and handleStripeWebhook (service-role User update by email) so the two
// sync paths never diverge.

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