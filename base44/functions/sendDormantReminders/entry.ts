import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { dormantEmail, resolveLang } from '../../shared/backendI18n.ts';

// Promemoria inserimenti per utenti dormienti (admin-only).
//
// Due modalita':
//  - mode='auto' (default, usata dal workflow giornaliero): considera gli
//    utenti verificati non admin iscritti tra 48h e 30 giorni fa, con zero
//    record, saltando chi ha gia' ricevuto 3 promemaria (cap) o uno negli
//    ultimi 7 giorni (cadenza settimanale minima).
//  - mode='campaign' (manuale, pulsante admin): ignora la finestra temporale
//    superiore e colpisce tutti i dormienti "mai ricordati" (storici inclusi),
//    sempre rispettando cap e cadenza settimanale.
//
// preview=true: esegue solo la selezione + controllo zero record senza inviare
// mail; restituisce dormant_count per il badge live dell'UI admin.
//
// Salva un record DormantReminder per ogni tentativo (sent/failed).

const USER_LIMIT = 500;
const MAX_REMINDERS = 3;
const WEEKLY_MS = 7 * 24 * 3600 * 1000;
const WINDOW_AUTO_MS = 30 * 24 * 3600 * 1000; // 30 giorni
const MIN_AGE_MS = 48 * 3600 * 1000;          // 48h

export default async function(req: Request): Promise<Response> {
  try {
    // Parse body opzionale (il workflow non invia body -> default 'auto')
    let body: any = {};
    try {
      const ct = req.headers.get('content-type') || '';
      if (ct.includes('application/json')) body = await req.json();
    } catch { /* ignore */ }
    const mode: 'auto' | 'campaign' = body.mode === 'campaign' ? 'campaign' : 'auto';
    const preview: boolean = !!body.preview;

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = Date.now();
    const autoStart = now - WINDOW_AUTO_MS;
    const minAge = now - MIN_AGE_MS;

    const [users, reminders] = await Promise.all([
      base44.asServiceRole.entities.User.filter({}, '-created_date', USER_LIMIT).catch(() => []),
      base44.asServiceRole.entities.DormantReminder.filter({}, '-sent_at', USER_LIMIT).catch(() => []),
    ]);

    // Mappa user_id -> { count, lastSent } per cap + cadenza settimanale
    const stats = new Map<string, { count: number; lastSent: number }>();
    for (const r of (reminders as any[])) {
      const uid = String(r.user_id || '');
      if (!uid) continue;
      const sentAt = r.sent_at ? new Date(r.sent_at).getTime() : 0;
      const prev = stats.get(uid) || { count: 0, lastSent: 0 };
      prev.count += 1;
      if (sentAt > prev.lastSent) prev.lastSent = sentAt;
      stats.set(uid, prev);
    }

    const candidates: any[] = [];
    for (const u of (users as any[])) {
      if (u.role === 'admin') continue;
      if (u.is_verified === false) continue; // salta solo se esplicitamente false
      if (!u.email) continue;
      const cd = u.created_date ? new Date(u.created_date).getTime() : 0;
      if (mode === 'auto') {
        // Finestra 48h–30 giorni
        if (cd < autoStart || cd > minAge) continue;
      } else {
        // Campaign: almeno 48h di vita, nessuna finestra superiore (storici)
        if (cd > minAge) continue;
      }
      const st = stats.get(String(u.id)) || { count: 0, lastSent: 0 };
      if (st.count >= MAX_REMINDERS) continue;          // cap 3
      if (st.lastSent && (now - st.lastSent) < WEEKLY_MS) continue; // 1/sett
      if (mode === 'campaign' && st.count > 0) continue; // solo "mai ricordati"
      candidates.push(u);
    }

    if (preview) {
      // Conta i dormienti veri (zero record) senza inviare
      let dormant = 0;
      for (const u of candidates) {
        if (!(await hasAnyRecord(base44, u.id))) dormant++;
      }
      return Response.json({ preview: true, dormant_count: dormant, candidates: candidates.length });
    }

    const sent: any[] = [];
    const failed: any[] = [];

    for (const u of candidates) {
      if (await hasAnyRecord(base44, u.id)) continue;

      const displayName = (u.full_name || '').split(' ')[0] || '';
      const lang = resolveLang(u.lang);
      const mail = dormantEmail(lang, displayName);
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
        await base44.asServiceRole.entities.DormantReminder.create({
          user_id: String(u.id),
          user_email: u.email,
          status: 'sent',
        });
        sent.push({ email: u.email });
      } catch (e) {
        const msg = String((e && e.message) || e);
        await base44.asServiceRole.entities.DormantReminder.create({
          user_id: String(u.id),
          user_email: u.email,
          status: 'failed',
          error: msg,
        });
        failed.push({ email: u.email, error: msg });
      }
    }

    return Response.json({
      mode,
      sent: sent.length,
      failed: failed.length,
      candidates: candidates.length,
      sent_details: sent,
      failed_details: failed,
    });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 },
    );
  }
}

// Verifica se l'utente ha almeno un record tra le 5 entity del diario.
async function hasAnyRecord(base44: any, userId: string): Promise<boolean> {
  const [symps, foods, meds, doses, recs] = await Promise.all([
    base44.asServiceRole.entities.SymptomEntry.filter({ created_by_id: userId }, '-created_date', 1).catch(() => []),
    base44.asServiceRole.entities.FoodEntry.filter({ created_by_id: userId }, '-created_date', 1).catch(() => []),
    base44.asServiceRole.entities.Medication.filter({ created_by_id: userId }, '-created_date', 1).catch(() => []),
    base44.asServiceRole.entities.MedicationDose.filter({ created_by_id: userId }, '-created_date', 1).catch(() => []),
    base44.asServiceRole.entities.MedicalRecord.filter({ created_by_id: userId }, '-created_date', 1).catch(() => []),
  ]);
  return !!(symps.length || foods.length || meds.length || doses.length || recs.length);
}