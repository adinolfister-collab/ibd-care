import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Dashboard Conversioni · sezione "Utenti & Trial" (admin-only).
// Restituisce tutti gli utenti registrati con stato abbonamento effettivo,
// giorni reali alla scadenza (calcolati da free_until / subscription_period_end),
// rank founder, messaggi AI nel mese e conteggi di uso feature aggregati
// per created_by_id (sintomi, pasti, dosi farmaci, referti) + ultima attività.

const USER_LIMIT = 500;
const ENTRY_LIMIT = 500;

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (isNaN(ms)) return null;
  return Math.ceil((ms - Date.now()) / 86400000);
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [users, symptoms, foods, medDoses, records] = await Promise.all([
      base44.asServiceRole.entities.User.filter({}, '-created_date', USER_LIMIT).catch(() => []),
      base44.asServiceRole.entities.SymptomEntry.filter({}, '-created_date', ENTRY_LIMIT).catch(() => []),
      base44.asServiceRole.entities.FoodEntry.filter({}, '-created_date', ENTRY_LIMIT).catch(() => []),
      base44.asServiceRole.entities.MedicationDose.filter({}, '-created_date', ENTRY_LIMIT).catch(() => []),
      base44.asServiceRole.entities.MedicalRecord.filter({}, '-created_date', ENTRY_LIMIT).catch(() => []),
    ]);

    // Aggrega conteggi + ultima attività per created_by_id
    const agg: Record<string, {
      symptoms: number; foods: number; meds: number; records: number;
      lastActivity: string | null;
    }> = {};
    const bump = (uid: string, kind: 'symptoms' | 'foods' | 'meds' | 'records', date: string | null) => {
      if (!uid) return;
      if (!agg[uid]) agg[uid] = { symptoms: 0, foods: 0, meds: 0, records: 0, lastActivity: null };
      agg[uid][kind]++;
      if (date && (!agg[uid].lastActivity || date > agg[uid].lastActivity)) {
        agg[uid].lastActivity = date;
      }
    };
    for (const e of symptoms) bump(String(e.created_by_id), 'symptoms', e.created_date);
    for (const e of foods) bump(String(e.created_by_id), 'foods', e.created_date);
    for (const e of medDoses) bump(String(e.created_by_id), 'meds', e.created_date);
    for (const e of records) bump(String(e.created_by_id), 'records', e.created_date);

    const rows = (users as any[]).map((u) => {
      const id = String(u.id);
      const c = agg[id] || { symptoms: 0, foods: 0, meds: 0, records: 0, lastActivity: null };
      const diaryTotal = c.symptoms + c.foods + c.meds + c.records;

      // Calcolo stato effettivo + giorni alla scadenza
      let rawStatus = u.subscription_status || 'none';
      let status = rawStatus;
      let daysToExpiry: number | null = null;
      let expiryDate: string | null = null;

      if (rawStatus === 'lifetime') {
        // Founder lifetime: attivo per sempre, nessuna scadenza
      } else if (rawStatus === 'three_months' && u.free_until) {
        const d = daysUntil(u.free_until);
        expiryDate = u.free_until;
        daysToExpiry = d;
        status = d !== null && d > 0 ? 'three_months' : 'expired';
      } else if (['active', 'trialing', 'past_due'].includes(rawStatus)) {
        // Abbonamento Stripe/Play: usa subscription_period_end
        const d = daysUntil(u.subscription_period_end);
        expiryDate = u.subscription_period_end || null;
        daysToExpiry = d;
      } else {
        // none / canceled / expired / undefined → prova in-app da free_until
        const hasFreeUntil = !!u.free_until;
        if (hasFreeUntil) {
          expiryDate = u.free_until;
          const d = daysUntil(u.free_until);
          daysToExpiry = d;
          status = d !== null && d > 0 ? 'trialing' : 'expired';
        } else {
          status = 'none';
        }
      }

      return {
        id,
        email: u.email || '',
        full_name: u.full_name || '',
        role: u.role || 'user',
        created_date: u.created_date || null,
        subscription_status: rawStatus,
        status,
        daysToExpiry,
        expiryDate,
        free_until: u.free_until || null,
        founder_rank: u.founder_rank ?? null,
        ai_messages_count: u.ai_messages_count || 0,
        diaryTotal,
        symptoms: c.symptoms,
        foods: c.foods,
        meds: c.meds,
        records: c.records,
        lastActivity: c.lastActivity,
      };
    });

    return Response.json({ users: rows, total: rows.length });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 },
    );
  }
}