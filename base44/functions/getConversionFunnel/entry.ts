import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Aggrega i ConversionEvent (event_name = premium_feature_attempt) per il
// pannello admin "Conversioni premium". Admin-only: 403 per i non admin.

const RANGE_DAYS: Record<string, number> = { today: 1, '7d': 7, '30d': 30, all: 0 };

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let payload: any = {};
    try { payload = await req.json(); } catch (_) { /* no body */ }
    const range = String(payload.range || '7d');
    const days = RANGE_DAYS[range] ?? 7;

    const query: any = {};
    if (range === 'today') {
      query.created_date = { $gte: startOfTodayISO() };
    } else if (days > 0) {
      const since = new Date(Date.now() - days * 86400000);
      query.created_date = { $gte: since.toISOString() };
    }

    let events: any[] = [];
    try {
      events = await base44.asServiceRole.entities.ConversionEvent.filter(query, '-created_date', 500);
    } catch (e) {
      return Response.json({ error: String((e && e.message) || e) }, { status: 500 });
    }

    const totalsMap: Record<string, number> = {};
    const dayMap: Record<string, number> = {};
    const usersSet: Record<string, boolean> = {};

    for (const ev of events) {
      const f = ev.feature || 'unknown';
      totalsMap[f] = (totalsMap[f] || 0) + 1;
      const d = (ev.created_date || '').slice(0, 10);
      if (d) dayMap[d] = (dayMap[d] || 0) + 1;
      if (ev.created_by_id) usersSet[ev.created_by_id] = true;
    }

    const totals = Object.entries(totalsMap)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count);

    const byDay = Object.entries(dayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    return Response.json({
      range,
      total: events.length,
      uniqueUsers: Object.keys(usersSet).length,
      totals,
      byDay,
    });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 }
    );
  }
}