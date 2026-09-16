import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets, waitUntil } from 'base44:runtime';
import { profileFieldsFromLemonSqueezy } from '../../shared/lemonSqueezySync.ts';

// Lemon Squeezy webhook handler — READY BUT INACTIVE.
//
// Register this endpoint in the Lemon Squeezy dashboard under Settings → Webhooks:
//   URL:    https://ibd-care.base44.app/functions/handleLemonSqueezyWebhook
//   Secret: the value stored as LEMON_SQUEEZY_WEBHOOK_SECRET
//   Events: subscription_created, subscription_updated,
//           subscription_cancelled, subscription_expired, order_created
//
// The handler verifies the X-Signature HMAC-SHA256 header, then syncs the
// matching user's profile access-level fields (service role, by email).

export default async function(req: Request): Promise<Response> {
  try {
    const webhookSecret = secrets.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
    const apiKey = secrets.get('LEMON_SQUEEZY_API_KEY');
    if (!webhookSecret || !apiKey) {
      return Response.json({ error: 'Lemon Squeezy webhook non configurato' }, { status: 503 });
    }

    const payload = await req.text();
    const signature = req.headers.get('x-signature');
    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify HMAC-SHA256 of the raw body with the webhook secret.
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    const expectedHex = Array.from(new Uint8Array(expected))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    if (expectedHex !== signature) {
      console.error('LemonSqueezy signature verification failed');
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);
    const type = event.meta?.event_name;
    const attrs = event.data?.attributes;

    // Optional app-id guard: ignore events from other apps sharing the LS account.
    const ownAppId = Deno.env.get('BASE44_APP_ID');
    const customAppId = attrs?.custom_data?.base44_app_id || event.meta?.custom_data?.base44_app_id;
    if (customAppId && ownAppId && customAppId !== ownAppId) {
      console.log(`LemonSqueezy event ${type} skipped: foreign app=${customAppId}`);
      return Response.json({ received: true, type, skipped: true });
    }

    console.log(`LemonSqueezy event ${type}`);

    // Sync the user profile after responding so LS gets a fast 2xx.
    waitUntil(syncProfileFromLemonSqueezy(apiKey, attrs, type));
    return Response.json({ received: true, type });
  } catch (error) {
    console.error('handleLemonSqueezyWebhook', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Resolve the customer email from the event and update the matching user's
// profile access level (service role, no user auth).
async function syncProfileFromLemonSqueezy(apiKey: string, attrs: any, type: string) {
  try {
    let email = attrs?.customer_email || attrs?.user_email || '';
    if (!email && attrs?.customer_id) {
      const custRes = await fetch(`https://api.lemonsqueezy.com/v1/customers/${attrs.customer_id}`, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/vnd.api+json' },
      });
      if (custRes.ok) {
        const cust = await custRes.json();
        email = cust.data?.attributes?.email || '';
      }
    }
    email = (email || '').toLowerCase();
    if (!email) return;

    const base44 = createClientFromRequest(new Request('https://ibd-care.base44.app'));
    const fields = profileFieldsFromLemonSqueezy(attrs);
    await base44.asServiceRole.entities.User.updateMany(
      { email },
      { $set: fields }
    );
    console.log(`synced profile ${email} -> ${fields.subscription_status} (${type})`);
    // KPI: premium_subscription_started — fire once when a new subscriber
    // is created (not on renewals/updates).
    if (type === 'subscription_created') {
      try {
        await base44.analytics.track({ eventName: 'premium_subscription_started', properties: { source: 'lemonsqueezy', email } });
        console.log('analytics: premium_subscription_started (lemonsqueezy)');
      } catch (e) { /* non blocking */ }
    }
  } catch (e) {
    console.error('syncProfileFromLemonSqueezy failed', e);
  }
}