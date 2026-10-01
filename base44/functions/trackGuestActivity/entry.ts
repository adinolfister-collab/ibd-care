import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Registra un'attivita' di un ospite anonimo (demo mode) nell'entita'
// ConversionEvent con is_guest=true. Aperto ai visitatori anonimi: usa il
// service role per creare il record (nessun auth richiesta), come trackPageView.
//
// feature: sintomo/pasto/terapia/... | source: 'used' | 'demo' | 'blocked'
// session_id e visitor_id arrivano dal client (stesso localStorage di PageView).

const VALID_SOURCES = new Set(['used', 'demo', 'blocked']);

// Defense-in-depth: esclude le attivita' dell'account admin dal tracciamento.
const EXCLUDED_ADMIN_ID = '6a80de4be246a7b03417c239';

export default async function(req: Request): Promise<Response> {
  try {
    let p: any = {};
    try { p = await req.json(); } catch (_) { /* no body */ }
    const feature = String(p.feature || '').slice(0, 64);
    if (!feature) {
      return Response.json({ ok: false, error: 'no feature' }, { status: 400 });
    }
    let source = String(p.source || 'used');
    if (!VALID_SOURCES.has(source)) source = 'used';
    const sessionId = String(p.session_id || '').slice(0, 64);
    const visitorId = String(p.visitor_id || '').slice(0, 64);
    const path = p.path ? String(p.path).slice(0, 200) : '';
    const userId = p.user_id ? String(p.user_id) : '';
    if (userId === EXCLUDED_ADMIN_ID) {
      return Response.json({ ok: true, excluded: true });
    }

    const base44 = createClientFromRequest(req);
    await base44.asServiceRole.entities.ConversionEvent.create({
      event_name: 'guest_activity',
      feature,
      source,
      is_guest: true,
      session_id: sessionId,
      visitor_id: visitorId,
      path,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 }
    );
  }
}