import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public read-only lookup of a shared report by its share_id. No login
// required: anyone with the link can view the report until it expires.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    let body: any = {};
    try { body = await req.json(); } catch { /* empty */ }
    const shareId = typeof body.share_id === 'string' ? body.share_id.trim() : '';
    if (!shareId) return Response.json({ error: 'share_id mancante' }, { status: 400 });

    const all = await base44.asServiceRole.entities.ShareableReport.list('-created_date', 500) as any[];
    const rec = all.find((r) => r.share_id === shareId);
    if (!rec) return Response.json({ error: 'Report non trovato' }, { status: 404 });

    const expired = rec.expires_at ? new Date(rec.expires_at).getTime() < Date.now() : false;
    if (expired) return Response.json({ error: 'Link scaduto' }, { status: 410 });

    return Response.json({
      report_type: rec.report_type,
      report_data: rec.report_data,
      expires_at: rec.expires_at,
    });
  } catch (error) {
    console.error('getShareableReport', error);
    return Response.json({ error: 'Impossibile caricare il report' }, { status: 502 });
  }
}