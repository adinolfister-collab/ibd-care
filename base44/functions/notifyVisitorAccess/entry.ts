import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Invia una notifica push all'admin/owner quando un utente effettua login o signup.
// Richiamato dal workflow "Notifica accesso visitatore" (trigger app_user_auth).
// Prerequisito: app nativa iOS/Android pubblicata con push credentials configurate.
// Sicurezza: l'endpoint è pubblico (nessun utente autenticato), quindi richiede
// un token condiviso fornito solo dal workflow per bloccare chiamate esterne arbitrarie.

const ACCESS_TOKEN = 'vc_notify_7e3a9f2c1b8d4a6f5e0c2b1a8d6f4e2c';

export default async function(req: Request): Promise<Response> {
  try {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch (_) {
      // payload vuoto se invocato senza body
    }

    // Verifica che la chiamata provenga dal workflow (token condiviso).
    if (String(payload.token || '') !== ACCESS_TOKEN) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    const eventType = String(payload.event_type || 'login');
    const email = String(payload.email || '');
    const authMethod = String(payload.auth_method || '');
    const fullName = String(payload.full_name || '');

    // Destinatari: admin/owner (user_id recuperato sulle entità User)
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    if (!admins || admins.length === 0) {
      return Response.json({ sent: 0, reason: 'no_admins' });
    }

    const actionLabel = eventType === 'signup' ? 'Iscrizione' : 'Login';
    const parts = [actionLabel];
    if (email) parts.push(email);
    if (authMethod) parts.push(authMethod);
    const content = parts.join(' · ');

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const admin of admins) {
      if (admin.notifications_enabled === false) { skipped++; continue; }
      try {
        await base44.asServiceRole.integrations.Core.SendPushNotification({
          user_id: admin.id,
          title: 'IBD Care – Nuovo accesso',
          content,
          action_label: 'Apri IBD Care',
          action_url: '/',
        });
        sent++;
      } catch (e) {
        errors.push(String((e && e.message) || e));
      }
    }

    return Response.json({ sent, skipped, content, errors });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 }
    );
  }
}