import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { classifyUser } from '../../shared/businessMetrics.ts';

// Cruscotto Crescita AdminBusiness (admin-only).
// Aggrega in un'unica risposta i tre KPI vs target di marketing (login,
// registrazioni, conversioni Premium su finestra 7 giorni con delta vs
// settimana precedente), una coorte di retention a 1/2/4 settimane e i
// driver di conversione per feature (incrocio ConversionEvent con stato
// abbonamento). I target riflettono la banda "nessun budget" del Marketing
// Plan (15 login / 5 registrazioni / 1 conversione Premium a settimana).
//
// Nota sui dati: il login per utente non e' un evento interrogabile da
// entity, quindi si usa un proxy (user_id distinti nelle PageView della
// settimana). La retention si appoggia a PageView + entity del diario
// (ultimi 500 record: approssimazione). Dove i dati mancano si ritorna
// null e il frontend mostra un messaggio.

const LIMIT = 500;
const WEEK_MS = 7 * 24 * 3600 * 1000;

const TARGETS = {
  logins: 15,
  registrations: 5,
  premium: 1,
};

function inRange(iso: string | null | undefined, from: number, to: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !isNaN(t) && t >= from && t < to;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = Date.now();
    const curFrom = now - WEEK_MS;
    const prevFrom = now - 2 * WEEK_MS;

    const [users, pageviews, symptoms, foods, medDoses, records, events] = await Promise.all([
      base44.asServiceRole.entities.User.filter({}, '-created_date', LIMIT).catch(() => []),
      base44.asServiceRole.entities.PageView.filter({}, '-created_date', LIMIT).catch(() => []),
      base44.asServiceRole.entities.SymptomEntry.filter({}, '-created_date', LIMIT).catch(() => []),
      base44.asServiceRole.entities.FoodEntry.filter({}, '-created_date', LIMIT).catch(() => []),
      base44.asServiceRole.entities.MedicationDose.filter({}, '-created_date', LIMIT).catch(() => []),
      base44.asServiceRole.entities.MedicalRecord.filter({}, '-created_date', LIMIT).catch(() => []),
      base44.asServiceRole.entities.ConversionEvent.filter({}, '-created_date', LIMIT).catch(() => []),
    ]);

    const nonAdminUsers = (users as any[]).filter((u) => u.role !== 'admin');

    // --- KPI ---
    const regsCur = nonAdminUsers.filter((u) => inRange(u.created_date, curFrom, now)).length;
    const regsPrev = nonAdminUsers.filter((u) => inRange(u.created_date, prevFrom, curFrom)).length;

    const premEv = (events as any[]).filter((e) => String(e.event_name || '') === 'premium_subscription_started');
    const premCur = premEv.filter((e) => inRange(e.created_date, curFrom, now)).length;
    const premPrev = premEv.filter((e) => inRange(e.created_date, prevFrom, curFrom)).length;

    // Login proxy: user_id distinti nelle PageView della settimana.
    const loginCurSet = new Set<string>();
    const loginPrevSet = new Set<string>();
    for (const pv of (pageviews as any[])) {
      const uid = pv.user_id ? String(pv.user_id) : '';
      if (!uid) continue;
      if (inRange(pv.created_date, curFrom, now)) loginCurSet.add(uid);
      else if (inRange(pv.created_date, prevFrom, curFrom)) loginPrevSet.add(uid);
    }
    const loginsCur = loginCurSet.size;
    const loginsPrev = loginPrevSet.size;

    const buildKpi = (key: string, label: string, cur: number, prev: number, target: number) => {
      const deltaPct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0);
      let status: 'reached' | 'on-track' | 'behind' = 'behind';
      if (cur >= target) status = 'reached';
      else if (cur >= target * 0.5) status = 'on-track';
      return { key, label, current: cur, previous: prev, deltaPct, target, status, unit: '/settimana' };
    };

    const kpis = [
      buildKpi('logins', 'Login attivi', loginsCur, loginsPrev, TARGETS.logins),
      buildKpi('registrations', 'Registrazioni', regsCur, regsPrev, TARGETS.registrations),
      buildKpi('premium', 'Conversioni Premium', premCur, premPrev, TARGETS.premium),
    ];

    // --- Retention coorte ---
    // Attivita' per utente: timestamp da PageView (user_id) + entity diario.
    const activity: Map<string, number[]> = new Map();
    const addAct = (uid: string, iso: string | null) => {
      if (!uid || !iso) return;
      const t = new Date(iso).getTime();
      if (isNaN(t)) return;
      const arr = activity.get(uid) || [];
      arr.push(t);
      activity.set(uid, arr);
    };
    for (const pv of (pageviews as any[])) addAct(pv.user_id ? String(pv.user_id) : '', pv.created_date);
    for (const arr of [symptoms, foods, medDoses, records]) {
      for (const e of (arr as any[])) addAct(e.created_by_id ? String(e.created_by_id) : '', e.created_date);
    }
    // ordina
    for (const arr of activity.values()) arr.sort((a, b) => a - b);

    // Coorti per settimana di registrazione (ultime 8 settimane registrabili)
    const cohorts: Record<number, number[]> = {};
    for (const u of nonAdminUsers) {
      const regTs = u.created_date ? new Date(u.created_date).getTime() : 0;
      if (!regTs || isNaN(regTs)) continue;
      const weekOffset = Math.floor((now - regTs) / WEEK_MS);
      if (weekOffset < 0 || weekOffset > 11) continue;
      (cohorts[weekOffset] = cohorts[weekOffset] || []).push(String(u.id));
    }

    const retentionCohorts = Object.keys(cohorts)
      .map(Number)
      .sort((a, b) => a - b)
      .map((weekOffset) => {
        const uids = cohorts[weekOffset];
        const registered = uids.length;
        const retainedIn = (offsetWeeks: number) => {
          if (weekOffset < offsetWeeks) return null; // finestra non ancora trascorsa
          let n = 0;
          for (const uid of uids) {
            const regTs = new Date(
              (nonAdminUsers.find((u) => String(u.id) === uid) as any).created_date,
            ).getTime();
            const from = regTs + offsetWeeks * WEEK_MS;
            const to = from + WEEK_MS;
            const arr = activity.get(uid) || [];
            if (arr.some((t) => t >= from && t < to)) n++;
          }
          return n;
        };
        const w1 = retainedIn(1);
        const w2 = retainedIn(2);
        const w4 = retainedIn(4);
        return {
          weekOffset,
          weekLabel: weekOffset === 0 ? 'Questa settimana' : `${weekOffset} sett fa`,
          registered,
          w1,
          w2,
          w4,
          w1pct: w1 !== null && registered > 0 ? Math.round((w1 / registered) * 100) : null,
          w2pct: w2 !== null && registered > 0 ? Math.round((w2 / registered) * 100) : null,
          w4pct: w4 !== null && registered > 0 ? Math.round((w4 / registered) * 100) : null,
        };
      })
      .reverse();

    const retention = {
      available: retentionCohorts.some((c) => c.w1 !== null || c.w2 !== null || c.w4 !== null),
      cohorts: retentionCohorts,
      note: 'Proxy: attivita\' rilevata da PageView + diario (ultimi 500 record).',
    };

    // --- Driver di conversione per feature ---
    const premiumIds = new Set<string>();
    const usersWithEvents = new Set<string>();
    for (const u of nonAdminUsers) {
      if (classifyUser(u) === 'premium') premiumIds.add(String(u.id));
    }
    const byFeatureUsers: Record<string, Set<string>> = {};
    for (const ev of (events as any[])) {
      const uid = ev.created_by_id ? String(ev.created_by_id) : '';
      if (!uid || ev.is_guest === true) continue;
      if (String(ev.source || '') !== 'used') continue;
      const f = String(ev.feature || 'unknown');
      if (!byFeatureUsers[f]) byFeatureUsers[f] = new Set();
      byFeatureUsers[f].add(uid);
      usersWithEvents.add(uid);
    }
    const baseline = usersWithEvents.size > 0
      ? (Array.from(usersWithEvents).filter((id) => premiumIds.has(id)).length / usersWithEvents.size)
      : 0;

    const drivers = Object.entries(byFeatureUsers)
      .map(([feature, set]) => {
        const totalUsers = set.size;
        let premiumUsers = 0;
        for (const id of set) if (premiumIds.has(id)) premiumUsers++;
        const conversionRate = totalUsers > 0 ? premiumUsers / totalUsers : 0;
        const lift = baseline > 0 ? conversionRate / baseline : 0;
        return {
          feature,
          totalUsers,
          premiumUsers,
          conversionRate: Math.round(conversionRate * 100),
          lift: Math.round(lift * 10) / 10,
        };
      })
      .filter((d) => d.totalUsers >= 2)
      .sort((a, b) => b.lift - a.lift)
      .slice(0, 8);

    return Response.json({
      kpis,
      targets: TARGETS,
      retention,
      drivers,
      dataNotes: [
        'Login: proxy da user_id distinti nelle PageView (evento __user_login__ non interrogabile da entity).',
        'Retention e driver basati sugli ultimi 500 record per entity: stima approssimativa.',
      ],
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 },
    );
  }
}