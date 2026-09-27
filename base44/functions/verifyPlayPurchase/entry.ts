import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { getGoogleAccessToken } from '../../shared/googlePlayAuth.ts';
import { profileFieldsFromPlaySubscription } from '../../shared/subscriptionSync.ts';

// Validates a Google Play Billing subscription purchase made in-app (Android
// native) against the Play Developer API, acknowledges it, and activates
// Premium on the user profile. Frontend sends { purchaseToken, productId }
// after a successful launchBillingFlow.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { /* empty */ }
    const { purchaseToken, productId } = body || {};
    if (!purchaseToken || !productId) {
      return Response.json({ error: 'purchaseToken e productId obbligatori' }, { status: 400 });
    }

    const pkg = secrets.get('GOOGLE_PLAY_PACKAGE_NAME');
    if (!pkg) return Response.json({ error: 'Google Play non configurato' }, { status: 500 });

    const token = await getGoogleAccessToken();
    if (!token) return Response.json({ error: 'Google Play non configurato' }, { status: 500 });

    // Fetch the subscription resource.
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}?accessToken=${encodeURIComponent(token)}`;
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const sub = await r.json();
    if (!r.ok) {
      console.error('Play API purchases.get error', sub);
      return Response.json({ error: sub?.error?.message || 'Verifica acquisto non riuscita' }, { status: 400 });
    }

    // paymentState 1 = received, 0 = pending, 2 = free trial, 3 = deferred.
    // We accept any paymentState !== undefined that resolves active (1 or 2).
    const active = (sub.paymentState === 1 || sub.paymentState === 2) &&
      (!sub.expiryTimeMillis || new Date(Number(sub.expiryTimeMillis)).getTime() > Date.now());
    if (!active) {
      return Response.json({ error: 'Acquisto non attivo', status: sub.paymentState }, { status: 400 });
    }

    // Acknowledge the purchase (required within 3 days, else it's auto-refunded).
    if (sub.acknowledgementState !== 1) {
      const ackUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}/acknowledge?accessToken=${encodeURIComponent(token)}`;
      await fetch(ackUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    }

    const fields = profileFieldsFromPlaySubscription(sub);
    try {
      await base44.auth.updateMe(fields);
    } catch (e) {
      console.error('updateMe play subscription failed', e);
    }
    try {
      await base44.analytics.track({ eventName: 'premium_subscription_started', properties: { source: 'google_play', productId } });
    } catch (e) { /* non blocking */ }

    return Response.json({ status: 'active', periodEnd: sub.expiryTimeMillis ? Number(sub.expiryTimeMillis) : null });
  } catch (error) {
    console.error('verifyPlayPurchase', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}