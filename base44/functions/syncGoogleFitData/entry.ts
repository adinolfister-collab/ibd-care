import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { refreshAccessToken, fetchAggregates } from '../../shared/googleFit.ts';

// Sincronizza i dati Google Fit (passi, calorie spese, distanza, peso) per
// l'utente corrente (all_users assente) o per tutti gli utenti connessi
// (all_users true, riservato admin / workflow giornaliero).
// Argomenti: { all_users?: boolean, days?: number }.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const days = Math.max(1, Math.min(Number(body.days) || 7, 90));
    const allUsers = body.all_users === true;

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (allUsers && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const connections = allUsers
      ? await base44.asServiceRole.entities.GoogleFitConnection.list('-created_date', 500)
      : await base44.entities.GoogleFitConnection.list('-created_date', 10);

    const now = Date.now();
    const startTime = now - days * 86400000;
    let synced = 0;
    let errors = 0;

    for (const conn of connections) {
      const ownerId = String(conn.created_by_id);
      try {
        let accessToken = conn.access_token;
        const expired = !conn.token_expires_at || new Date(conn.token_expires_at).getTime() < now + 60000;
        if (expired) {
          const tokens = await refreshAccessToken(conn.refresh_token);
          accessToken = tokens.access_token;
          const expiresAt = new Date(now + (tokens.expires_in || 3600) * 1000).toISOString();
          await base44.asServiceRole.entities.GoogleFitConnection.update(conn.id, {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || conn.refresh_token,
            token_expires_at: expiresAt,
            last_sync_at: new Date().toISOString(),
          });
        }

        const dailyData = await fetchAggregates(accessToken, startTime, now);
        for (const day of dailyData) {
          if (day.steps || day.kcal_expended || day.distance_m) {
            await upsertActivity(base44, ownerId, day);
          }
          if (day.weight_kg) {
            await upsertWeight(base44, ownerId, day);
          }
        }
        synced++;
      } catch (e) {
        console.error(`syncGoogleFitData conn ${conn.id}: ${e}`);
        errors++;
      }
    }
    return Response.json({ synced, errors, days });
  } catch (error) {
    console.error('syncGoogleFitData', error);
    return Response.json({ error: String((error && error.message) || error) }, { status: 500 });
  }
}

async function upsertActivity(base44: any, ownerId: string, day: any) {
  const existing = await base44.asServiceRole.entities.ActivityEntry.filter(
    { entry_date: day.date, created_by_id: ownerId }, '-entry_date', 10
  );
  const payload = {
    entry_date: day.date,
    steps: Math.round(day.steps),
    kcal_expended: Math.round(day.kcal_expended),
    distance_m: Math.round(day.distance_m),
    source: 'googlefit',
    created_by_id: ownerId,
  };
  if (existing.length > 0) {
    await base44.asServiceRole.entities.ActivityEntry.update(existing[0].id, payload);
  } else {
    await base44.asServiceRole.entities.ActivityEntry.create(payload);
  }
}

async function upsertWeight(base44: any, ownerId: string, day: any) {
  const existing = await base44.asServiceRole.entities.WeightEntry.filter(
    { entry_date: day.date, source: 'googlefit', created_by_id: ownerId }, '-entry_date', 10
  );
  if (existing.length > 0) {
    await base44.asServiceRole.entities.WeightEntry.update(existing[0].id, { weight_kg: day.weight_kg });
  } else {
    await base44.asServiceRole.entities.WeightEntry.create({
      entry_date: day.date,
      weight_kg: day.weight_kg,
      source: 'googlefit',
      created_by_id: ownerId,
    });
  }
}