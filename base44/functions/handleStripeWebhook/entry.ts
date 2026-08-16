import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@17.7.0';
import { secrets } from 'base44:runtime';

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

    switch (event.type) {
      case 'checkout.session.completed':
      case 'invoice.paid':
      case 'invoice.payment_failed':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        console.log(`Stripe event ${event.type} | app=${appId || ''} | customer=${obj && obj.customer ? obj.customer : ''}`);
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