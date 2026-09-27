import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Conta le sessioni distinte attive negli ultimi 10 minuti sull'entita'
// PageView. Aperto ai visitatori anonimi (service role, nessuna auth):
// il badge "utenti online" e' pubblico.
const WINDOW_MS = 10 * 60 * 1000;

// Account admin da escludere dal conteggio utenti online.
const EXCLUDED_ADMIN_ID = '6a80de4be246a7b03417c239';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();
    const recent = await base44.asServiceRole.entities.PageView.filter(
      { entered_at: { $gte: cutoff } },
      '-entered_at',
      1000
    );
    const sessions = new Set<string>();
    for (const r of recent as any[]) {
      if (!r) continue;
      if (r.user_id && String(r.user_id) === EXCLUDED_ADMIN_ID) continue;
      if (r.session_id) sessions.add(r.session_id);
    }
    return Response.json({ count: sessions.size });
  } catch (error) {
    return Response.json(
      { count: 0, error: String((error && error.message) || error) },
      { status: 500 }
    );
  }
}