// Shared mapping from a Lemon Squeezy subscription object to the user-profile
// access-level fields (same shape used by the Stripe sync path so the
// getSubscriptionStatus / profile read stays provider-agnostic).
//
// Lemon Squeezy webhook `data.attributes` exposes: status, renews_at,
// ends_at, cancelled, customer_email, variant_id, product_id.
// Active states: 'active' and 'on_trial'.

export function profileFieldsFromLemonSqueezy(attrs: any) {
  if (!attrs) {
    return {
      subscription_status: 'none',
      subscription_trial_end: null,
      subscription_period_end: null,
      subscription_cancel_at_period_end: false,
    };
  }
  const status = attrs.status === 'on_trial' ? 'trialing'
    : attrs.status === 'active' ? 'active'
    : attrs.status === 'cancelled' || attrs.status === 'expired' ? 'none'
    : 'none';
  return {
    subscription_status: status,
    subscription_trial_end: attrs.trial_ends_at ? new Date(attrs.trial_ends_at).toISOString() : null,
    subscription_period_end: attrs.renews_at ? new Date(attrs.renews_at).toISOString() : null,
    subscription_cancel_at_period_end: !!attrs.cancelled,
  };
}