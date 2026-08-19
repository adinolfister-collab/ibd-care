import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@17.7.0';
import { secrets, waitUntil } from 'base44:runtime';
import { profileFieldsFromSubscription } from '../../shared/subscriptionSync.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const secretKey = secrets.get('STRIPE_SECRET_KEY');
    const webhookSecret = secrets.get('STRIPE_WEBHOOK_SECRET');
    if (!secretKey || !webhookSecret) {
      return Response.json({ error: 'Stripe webhook non configurato' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);
    const payload = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
    } catch (err) {
      console.error('Stripe signature verification failed', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const obj = event.data && event.data.object ? event.data.object : null;
    const appId = obj && obj.metadata ? obj.metadata.base44_app_id : undefined;
    const ownAppId = Deno.env.get('BASE44_APP_ID');

    // Ignora eventi provenienti da altre app che condividono lo stesso account Stripe
    if (appId && ownAppId && appId !== ownAppId) {
      console.log(`Stripe event ${event.type} skipped: foreign app=${appId}`);
      return Response.json({ received: true, type: event.type, skipped: true });
    }

    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        console.log(`Stripe event ${event.type} | app=${appId || ''} | customer=${obj && obj.customer ? obj.customer : ''}`);
        // Real-time sync: resolve the subscription + customer email, then
        // update the matching Base44 user's profile access level. Runs after
        // the response so Stripe gets a fast 2xx.
        waitUntil(syncProfileFromStripeEvent(secretKey, event.type, obj));
        break;
      default:
        break;
    }

    return Response.json({ received: true, type: event.type });
  } catch (error) {
    console.error('handleStripeWebhook', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Resolve the subscription object + customer email for an event and update
// the matching Base44 user's profile access level (service role, no user auth).
async function syncProfileFromStripeEvent(secretKey: string, type: string, obj: any) {
  try {
    const headers = { 'Authorization': `Bearer ${secretKey}`, 'Stripe-Version': '2025-10-29.clover' };
    const customerId = obj?.customer;
    if (!customerId) return;

    // For subscription events the object IS the subscription; for checkout/
    // invoice events we fetch the subscription by id.
    let sub: any = null;
    if (type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
      sub = obj;
    } else {
      const subId = obj?.subscription;
      if (subId) {
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, { headers });
        if (subRes.ok) sub = await subRes.json();
      }
    }

    // Resolve the customer email.
    const custRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, { headers });
    if (!custRes.ok) return;
    const cust = await custRes.json();
    const email = (cust.email || '').toLowerCase();
    if (!email) return;

    const base44 = createClientFromRequest(new Request('https://ibd-care.base44.app'));
    const fields = profileFieldsFromSubscription(sub);
    await base44.asServiceRole.entities.User.updateMany(
      { email },
      { $set: fields }
    );
    console.log(`synced profile ${email} -> ${fields.subscription_status} (${type})`);
  } catch (e) {
    console.error('syncProfileFromStripeEvent failed', e);
  }
}