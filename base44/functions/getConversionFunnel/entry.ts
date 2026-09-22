import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Dashboard Conversioni: aggrega PageView (visitatori, paesi, permanenza) +
// funnel macro-step (visite -> registrazioni -> primo diario -> paywall ->
// abbonamento Premium). Admin-only: 403 per i non admin.

const RANGE_DAYS: Record<string, number> = { today: 1, '7d': 7, '30d': 30, all: 0 };
const SESSION_GAP_SEC = 1800; // 30 min: gap tra page-view oltre il quale si chiude la sessione

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function rangeQuery(range: string): any {
  const q: any = {};
  if (range === 'today') {
    q.created_date = { $gte: startOfTodayISO() };
  } else {
    const days = RANGE_DAYS[range] ?? 7;
    if (days > 0) {
      q.created_date = { $gte: new Date(Date.now() - days * 86400000).toISOString() };
    }
  }
  return q;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let p: any = {};
    try { p = await req.json(); } catch (_) { /* no body */ }
    const range = String(p.range || '7d');
    const rq = rangeQuery(range);

    const [pageviews, users, symptoms, foods, meds, records, events] = await Promise.all([
      base44.asServiceRole.entities.PageView.filter(rq, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.User.filter(rq, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.SymptomEntry.filter(rq, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.FoodEntry.filter(rq, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.Medication.filter(rq, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.MedicalRecord.filter(rq, '-created_date', 500).catch(() => []),
      base44.asServiceRole.entities.ConversionEvent.filter(rq, '-created_date', 500).catch(() => []),
    ]);

    // --- Visitatori, paesi, raggruppamento per sessione ---
    const sessions = new Set<string>();
    const visitors = new Set<string>();
    const countrySessions: Record<string, Set<string>> = {};
    const bySession: Record<string, any[]> = {};

    for (const pv of pageviews) {
      const sid = pv.session_id || '';
      if (sid) sessions.add(sid);
      visitors.add(pv.user_id || sid || '');
      const c = pv.country || 'Unknown';
      if (!countrySessions[c]) countrySessions[c] = new Set();
      countrySessions[c].add(sid);
      if (sid) {
        (bySession[sid] = bySession[sid] || []).push(pv);
      }
    }

    const visite = sessions.size;
    const visitatoriUnici = visitors.size;

    const topCountries = Object.entries(countrySessions)
      .map(([country, set]) => ({ country, sessions: set.size }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);

    // --- Durata sessione + permanenza per sezione ---
    let totalSessionDur = 0;
    let sessionCount = 0;
    const sectionDur: Record<string, number[]> = {};

    for (const sid of Object.keys(bySession)) {
      const arr = bySession[sid]
        .slice()
        .sort((a, b) => (a.created_date < b.created_date ? -1 : 1));
      for (let i = 0; i < arr.length - 1; i++) {
        const t1 = new Date(arr[i].created_date).getTime();
        const t2 = new Date(arr[i + 1].created_date).getTime();
        let d = Math.round((t2 - t1) / 1000);
        if (d < 0) d = 0;
        if (d > SESSION_GAP_SEC) d = SESSION_GAP_SEC;
        totalSessionDur += d;
        const sec = arr[i].section || 'Altro';
        (sectionDur[sec] = sectionDur[sec] || []).push(d);
      }
      if (arr.length >= 2) sessionCount++;
    }

    const avgSessionSec = sessionCount ? Math.round(totalSessionDur / sessionCount) : 0;

    const sectionDuration = Object.entries(sectionDur)
      .map(([section, arr]) => ({
        section,
        avgSec: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
        views: arr.length,
      }))
      .sort((a, b) => b.avgSec - a.avgSec);

    // --- Funnel macro-step ---
    const registrations = users.length;

    const diaryUsersSet = new Set<string>();
    for (const arr of [symptoms, foods, meds, records]) {
      for (const e of arr) {
        if (e.created_by_id) diaryUsersSet.add(e.created_by_id);
      }
    }
    const diaryUsers = diaryUsersSet.size;

    const paywallUsers = new Set<string>();
    let abbonamentoCount = 0;
    for (const ev of events) {
      const name = String(ev.event_name || '').toLowerCase();
      if (name === 'premium_subscription_started') abbonamentoCount++;
      if (
        name.includes('premium') ||
        name.includes('paywall') ||
        name.includes('feature_attempt')
      ) {
        if (ev.created_by_id) paywallUsers.add(ev.created_by_id);
      }
    }

    const rawFunnel = [
      { key: 'visite', label: 'Visite', value: visite },
      { key: 'registrazioni', label: 'Registrazioni', value: registrations },
      { key: 'diario', label: 'Primo inserimento diario', value: diaryUsers },
      { key: 'paywall', label: 'Paywall', value: paywallUsers.size },
      { key: 'abbonamento', label: 'Abbonamento Premium', value: abbonamentoCount },
    ];
    const funnel = rawFunnel.map((s, i) => ({
      ...s,
      pct: i === 0
        ? 100
        : (rawFunnel[i - 1].value > 0 ? Math.round((s.value / rawFunnel[i - 1].value) * 100) : 0),
    }));

    return Response.json({
      range,
      visite,
      visitatoriUnici,
      avgSessionSec,
      topCountries,
      sectionDuration,
      funnel,
    });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 }
    );
  }
}