import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { profileFieldsFromSubscription } from '../../shared/subscriptionSync.ts';

const PROMO_DAYS = 14;

export default async function(req: Request): Promise<Response> {
  let base44;
  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const secretKey = secrets.get('STRIPE_SECRET_KEY');
    if (!secretKey) return Response.json({ error: 'Stripe non configurato' }, { status: 500 });

    const headers = { 'Authorization': `Bearer ${secretKey}`, 'Stripe-Version': '2025-10-29.clover' };

    let sub = null;
    if (user.email) {
      const custRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=20`, { headers });
      const custData = await custRes.json();
      const customers = (custData.data || []).filter((c) => (c.email || '').toLowerCase() === user.email.toLowerCase());
      for (const c of customers) {
        const subRes = await fetch(`https://api.stripe.com/v1/customers/${c.id}/subscriptions?limit=50`, { headers });
        const subData = await subRes.json();
        const found = (subData.data || []).find((s) => ['active', 'trialing'].includes(s.status));
        if (found) { sub = found; break; }
      }
    }

    // Sync the resolved Stripe status onto the user profile (does not touch promo_start_date).
    try {
      await base44.auth.updateMe(profileFieldsFromSubscription(sub));
    } catch (e) {
      console.error('sync subscription to profile failed', e);
    }

    if (sub) {
      const now = Math.floor(Date.now() / 1000);
      return Response.json({
        status: sub.status,
        trialRemaining: sub.trial_end ? Math.max(0, Math.ceil((sub.trial_end - now) / 86400)) : 0,
        trialEnd: sub.trial_end ? sub.trial_end * 1000 : null,
        periodEnd: sub.current_period_end ? sub.current_period_end * 1000 : null,
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
      });
    }

    // No active Stripe subscription: evaluate the in-app free promo (14 days).
    // On first check, persist promo_start_date so the 14-day window is per-user.
    let promoStart = user.promo_start_date || null;
    if (!promoStart) {
      promoStart = new Date().toISOString();
      try {
        await base44.auth.updateMe({ promo_start_date: promoStart });
      } catch (e) {
        console.error('set promo_start_date failed', e);
      }
    }
    const startMs = new Date(promoStart).getTime();
    if (!isNaN(startMs)) {
      const daysElapsed = Math.floor((Date.now() - startMs) / 86400000);
      const daysRemaining = Math.max(0, PROMO_DAYS - daysElapsed);
      if (daysRemaining > 0) {
        return Response.json({ status: 'promo', promoDaysRemaining: daysRemaining });
      }
    }

    return Response.json({ status: 'none' });
  } catch (error) {
    console.error('getSubscriptionStatus', error);
    return Response.json({ error: 'Impossibile verificare lo stato abbonamento' }, { status: 502 });
  }
}