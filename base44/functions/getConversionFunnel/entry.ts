import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Dashboard Conversioni (stile Analytics): aggrega PageView con percorso,
// provenienza (referrer), paese, dispositivo e sessioni; unisce il funnel
// macro-step visite -> registrazioni -> diario -> paywall -> abbonamento.
// Admin-only: 403 per i non admin.

const RANGE_DAYS: Record<string, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90, all: 0 };
const SESSION_GAP_SEC = 1800; // 30 min: gap tra page-view oltre il quale si chiude la sessione
const PAGE_LIMIT = 500;

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

// Raggruppa e restituisce i top N per una chiave, con conteggio sessioni uniche
// e view totali.
function topBy<T>(
  items: T[],
  keyFn: (x: T) => string,
  sessionFn: (x: T) => string,
  limit: number,
) {
  const views: Record<string, number> = {};
  const sess: Record<string, Set<string>> = {};
  for (const it of items) {
    const k = keyFn(it) || 'Unknown';
    views[k] = (views[k] || 0) + 1;
    if (!sess[k]) sess[k] = new Set();
    const s = sessionFn(it);
    if (s) sess[k].add(s);
  }
  return Object.entries(views)
    .map(([key, v]) => ({ key, views: v, sessions: sess[key]?.size || 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
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
      base44.asServiceRole.entities.PageView.filter(rq, '-created_date', PAGE_LIMIT).catch(() => []),
      base44.asServiceRole.entities.User.filter(rq, '-created_date', PAGE_LIMIT).catch(() => []),
      base44.asServiceRole.entities.SymptomEntry.filter(rq, '-created_date', PAGE_LIMIT).catch(() => []),
      base44.asServiceRole.entities.FoodEntry.filter(rq, '-created_date', PAGE_LIMIT).catch(() => []),
      base44.asServiceRole.entities.Medication.filter(rq, '-created_date', PAGE_LIMIT).catch(() => []),
      base44.asServiceRole.entities.MedicalRecord.filter(rq, '-created_date', PAGE_LIMIT).catch(() => []),
      base44.asServiceRole.entities.ConversionEvent.filter(rq, '-created_date', PAGE_LIMIT).catch(() => []),
    ]);

    // --- Sessioni, visitatori, raggruppamento ---
    const sessions = new Set<string>();
    const visitors = new Set<string>();
    const anonimiVisitors = new Set<string>();
    const loggedVisitors = new Set<string>();
    const countrySessions: Record<string, Set<string>> = {};
    const bySession: Record<string, any[]> = {};

    for (const pv of pageviews) {
      const sid = pv.session_id || '';
      if (sid) sessions.add(sid);
      const uid = pv.user_id ? String(pv.user_id) : '';
      const vid = pv.visitor_id ? String(pv.visitor_id) : '';
      if (uid) {
        loggedVisitors.add(uid);
        visitors.add(uid);
      } else if (vid) {
        anonimiVisitors.add(vid);
        visitors.add(vid);
      }
      const c = pv.country || 'Unknown';
      if (!countrySessions[c]) countrySessions[c] = new Set();
      countrySessions[c].add(sid || vid || uid);
      if (sid) {
        (bySession[sid] = bySession[sid] || []).push(pv);
      }
    }

    const visite = sessions.size;
    const visitatoriUnici = visitors.size;
    const visitatoriAnonimi = anonimiVisitors.size;
    const visitatoriLoggati = loggedVisitors.size;

    const topCountries = Object.entries(countrySessions)
      .map(([country, set]) => ({ country, sessions: set.size }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);

    // Pagine visitate (per path), provenienza (referrer), dispositivi
    const topPages = topBy(
      pageviews,
      (pv) => pv.path || '',
      (pv) => pv.session_id || '',
      15,
    );
    const topReferrers = topBy(
      pageviews,
      (pv) => pv.referrer || 'Direct',
      (pv) => pv.session_id || '',
      10,
    );
    const devices = topBy(
      pageviews,
      (pv) => pv.device || 'desktop',
      (pv) => pv.session_id || '',
      3,
    );

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

    // --- Attivita' ospiti (demo mode) ---
    // Aggrega i ConversionEvent con is_guest=true: eventi totali, visitatori
    // e sessioni distinti, breakdown per feature e source, e tasso
    // demo->registrazione (visitor_id ospiti che poi compaiono come user_id
    // loggato nelle page-view dello stesso periodo).
    const guestEvents = events.filter((ev) => ev.is_guest === true);
    const guestVisitors = new Set<string>();
    const guestSessions = new Set<string>();
    const byFeature: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    for (const ev of guestEvents) {
      const vid = ev.visitor_id ? String(ev.visitor_id) : '';
      const sid = ev.session_id ? String(ev.session_id) : '';
      if (vid) guestVisitors.add(vid);
      if (sid) guestSessions.add(sid);
      const f = String(ev.feature || 'unknown');
      byFeature[f] = (byFeature[f] || 0) + 1;
      const s = String(ev.source || 'used');
      bySource[s] = (bySource[s] || 0) + 1;
    }
    // visitor_id che, nello stesso periodo, hanno una page-view con user_id
    // valorizzato: segno che l'ospite si e' poi registrato/loggato.
    const convertedVisitors = new Set<string>();
    for (const pv of pageviews) {
      const uid = pv.user_id ? String(pv.user_id) : '';
      const vid = pv.visitor_id ? String(pv.visitor_id) : '';
      if (uid && vid && guestVisitors.has(vid)) convertedVisitors.add(vid);
    }
    // Conversione del gate demo scaduta: demo_gate_shown vs demo_gate_registered
    const gateShown = byFeature['demo_gate_shown'] || 0;
    const gateRegistered = byFeature['demo_gate_registered'] || 0;
    const guestStats = {
      total: guestEvents.length,
      distinctVisitors: guestVisitors.size,
      distinctSessions: guestSessions.size,
      gateShown,
      gateRegistered,
      gateConversionRate: gateShown > 0
        ? Math.round((gateRegistered / gateShown) * 100)
        : 0,
      byFeature: Object.entries(byFeature)
        .map(([feature, count]) => ({ feature, count }))
        .sort((a, b) => b.count - a.count),
      bySource: Object.entries(bySource)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      demoToRegistration: convertedVisitors.size,
      demoToRegistrationRate: guestVisitors.size > 0
        ? Math.round((convertedVisitors.size / guestVisitors.size) * 100)
        : 0,
    };

    return Response.json({
      range,
      visite,
      visitatoriUnici,
      visitatoriAnonimi,
      visitatoriLoggati,
      avgSessionSec,
      topCountries,
      topPages,
      topReferrers,
      devices,
      sectionDuration,
      funnel,
      guestStats,
    });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 }
    );
  }
}