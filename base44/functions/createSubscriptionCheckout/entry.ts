import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let plan = 'monthly';
    try {
      const body = await req.json();
      if (body && body.plan === 'yearly') plan = 'yearly';
    } catch { /* default monthly */ }

    const secretKey = secrets.get('STRIPE_SECRET_KEY');
    const priceId = plan === 'yearly'
      ? secrets.get('STRIPE_ANNUAL_PRICE_ID')
      : secrets.get('STRIPE_LIVE_PRICE_ID_199');
    const appId = Deno.env.get('BASE44_APP_ID');
    if (!secretKey) return Response.json({ error: 'Stripe non configurato' }, { status: 500 });
    if (!priceId) return Response.json({ error: 'Piano non ancora configurato' }, { status: 503 });

    const origin = new URL(req.url).origin;
    const successUrl = `${origin}/abbonamento?checkout=success`;
    const cancelUrl = `${origin}/abbonamento?checkout=cancel`;

    // 14-day free trial applied automatically only to genuinely new users.
    // If the email already belongs to a Stripe customer with any past/active
    // subscription, the trial is skipped to prevent repeated free periods.
    let isNewUser = true;
    if (user.email) {
      try {
        const custRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=20`, {
          headers: { 'Authorization': `Bearer ${secretKey}`, 'Stripe-Version': '2025-10-29.clover' }
        });
        const custData = await custRes.json();
        const customers = (custData.data || []).filter((c) => (c.email || '').toLowerCase() === user.email.toLowerCase());
        for (const c of customers) {
          const subRes = await fetch(`https://api.stripe.com/v1/customers/${c.id}/subscriptions?limit=50`, {
            headers: { 'Authorization': `Bearer ${secretKey}`, 'Stripe-Version': '2025-10-29.clover' }
          });
          const subData = await subRes.json();
          if ((subData.data || []).length > 0) { isNewUser = false; break; }
        }
      } catch (e) {
        console.error('trial eligibility check failed', e);
      }
    }

    const body = new URLSearchParams();
    body.set('mode', 'subscription');
    body.set('line_items[0][price]', priceId);
    body.set('line_items[0][quantity]', '1');
    if (isNewUser) body.set('subscription_data[trial_period_days]', '30');
    body.set('metadata[base44_app_id]', appId || '');
    body.set('subscription_data[metadata][base44_app_id]', appId || '');
    body.set('success_url', successUrl);
    body.set('cancel_url', cancelUrl);
    body.set('allow_promotion_codes', 'true');
    if (user.email) body.set('customer_email', user.email);

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Stripe-Version': '2025-10-29.clover',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': crypto.randomUUID()
      },
      body
    });
    const session = await res.json();
    if (!res.ok) {
      console.error('Stripe checkout error', session.error);
      return Response.json({ error: session.error?.message || 'Stripe error' }, { status: 400 });
    }
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createSubscriptionCheckout', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}