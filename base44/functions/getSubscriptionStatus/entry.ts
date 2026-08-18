import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { profileFieldsFromSubscription } from '../../shared/subscriptionSync.ts';

export default async function(req: Request): Promise<Response> {
  let base44;
  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const secretKey = secrets.get('STRIPE_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'Stripe non configurato' }, { status: 500 });
    if (!user.email) return Response.json({ status: 'none' });

    const headers = { 'Authorization': `Bearer ${secretKey}`, 'Stripe-Version': '2025-10-29.clover' };

    const custRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=20`, { headers });
    const custData = await custRes.json();
    const customers = (custData.data || []).filter((c) => (c.email || '').toLowerCase() === user.email.toLowerCase());

    let sub = null;
    for (const c of customers) {
      const subRes = await fetch(`https://api.stripe.com/v1/customers/${c.id}/subscriptions?limit=50`, { headers });
      const subData = await subRes.json();
      const found = (subData.data || []).find((s) => ['active', 'trialing'].includes(s.status));
      if (found) { sub = found; break; }
    }

    // Sync the resolved Stripe status onto the user profile so the access
    // level is persisted and visible across the app (cleared when none).
    try {
      await base44.auth.updateMe(profileFieldsFromSubscription(sub));
    } catch (e) {
      console.error('sync subscription to profile failed', e);
    }

    if (!sub) return Response.json({ status: 'none' });

    const now = Math.floor(Date.now() / 1000);
    return Response.json({
      status: sub.status,
      trialRemaining: sub.trial_end ? Math.max(0, Math.ceil((sub.trial_end - now) / 86400)) : 0,
      trialEnd: sub.trial_end ? sub.trial_end * 1000 : null,
      periodEnd: sub.current_period_end ? sub.current_period_end * 1000 : null,
      cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    });
  } catch (error) {
    console.error('getSubscriptionStatus', error);
    try {
      if (!base44) base44 = createClientFromRequest(req);
      await base44.auth.updateMe(profileFieldsFromSubscription(null));
    } catch (e) {}
    return Response.json({ status: 'none' });
  }
}