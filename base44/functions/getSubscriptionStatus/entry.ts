import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { profileFieldsFromSubscription } from '../../shared/subscriptionSync.ts';

export default async function(req: Request): Promise<Response> {
  let base44;
  try {
    base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 1) Founder campaign grants bypass Stripe/trial: lifetime = active forever,
    // three_months = active until free_until.
    if (user.subscription_status === 'lifetime') {
      return Response.json({ status: 'active', grant: 'lifetime' });
    }
    if (user.subscription_status === 'three_months' && user.free_until) {
      const endMs = new Date(user.free_until).getTime();
      if (!isNaN(endMs)) {
        const days = Math.max(0, Math.ceil((endMs - Date.now()) / 86400000));
        if (days > 0) {
          return Response.json({ status: 'active', grant: 'three_months', trialRemaining: days, trialEnd: endMs });
        }
      }
    }

    const secretKey = secrets.get('STRIPE_SECRET_KEY');

    // 2) No more auto-trial at registration: the 30-day demo (device-tracked)
    //    is the only free trial. New users with no subscription and no
    //    free_until go straight to the Stripe sync / 'none' path below.
    //    A free_until set by a Founder grant or a previously started (now
    //    elapsed) trial is still honored here.
    const hasFreeUntil = !!user.free_until;
    const neverSubscribed = ['none', undefined, null, 'expired', 'canceled'].includes(user.subscription_status);

    // Active 30-day trial in progress.
    if (hasFreeUntil && neverSubscribed) {
      const endMs = new Date(user.free_until).getTime();
      if (!isNaN(endMs)) {
        const days = Math.max(0, Math.ceil((endMs - Date.now()) / 86400000));
        if (days > 0) {
          return Response.json({
            status: 'trialing',
            trial: true,
            trialRemaining: days,
            trialEnd: endMs,
          });
        }
        // Trial elapsed and no subscription → expired (read-only).
        return Response.json({ status: 'expired', trial: true, trialEnd: endMs });
      }
    }

    // 3) Stripe subscription sync (web fallback / pre-Play users).
    let sub = null;
    if (secretKey && user.email) {
      const headers = { 'Authorization': `Bearer ${secretKey}`, 'Stripe-Version': '2025-10-29.clover' };
      const custRes = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=20`, { headers });
      const custData = await custRes.json();
      const customers = (custData.data || []).filter((c) => (c.email || '').toLowerCase() === user.email.toLowerCase());
      for (const c of customers) {
        const subRes = await fetch(`https://api.stripe.com/v1/customers/${c.id}/subscriptions?limit=50`, { headers });
        const subData = await subRes.json();
        const found = (subData.data || []).find((s) => ['active', 'trialing'].includes(s.status));
        if (found) { sub = found; break; }
      }
      try {
        await base44.auth.updateMe(profileFieldsFromSubscription(sub));
      } catch (e) {
        console.error('sync subscription to profile failed', e);
      }
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

    // No active subscription. If a trial was ever used (free_until set, past),
    // the entitlement is expired (read-only); otherwise genuinely none.
    if (hasFreeUntil) {
      return Response.json({ status: 'expired', trial: true });
    }
    return Response.json({ status: 'none' });
  } catch (error) {
    console.error('getSubscriptionStatus', error);
    return Response.json({ error: 'Impossibile verificare lo stato abbonamento' }, { status: 502 });
  }
}