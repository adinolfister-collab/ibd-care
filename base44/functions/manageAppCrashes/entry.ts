import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Admin-only: elenca i crash recenti (con filtro gravita') e marca come risolti.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    let p: any = {};
    try {
      p = await req.json();
    } catch (_) {
      /* no body */
    }
    const action = String(p.action || 'list');

    if (action === 'list') {
      const severity = p.severity && p.severity !== 'all' ? String(p.severity) : null;
      const query = severity ? { severity } : {};
      const items = await base44.asServiceRole.entities.AppCrash.filter(
        query,
        '-last_seen',
        200
      );
      return Response.json({ items: items || [] });
    }

    if (action === 'resolve') {
      const id = String(p.id || '');
      if (!id) return Response.json({ error: 'no id' }, { status: 400 });
      await base44.asServiceRole.entities.AppCrash.update(id, { resolved: true });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 }
    );
  }
}