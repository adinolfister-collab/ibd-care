import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { dormantEmail, resolveLang } from '../../shared/backendI18n.ts';

// Promemoria inserimenti 48h (admin-only, invocato dal workflow giornaliero).
// Individua gli utenti verificati con created_date tra 48 e 72 ore fa e zero
// record tra SymptomEntry, FoodEntry, Medication, MedicationDose e MedicalRecord;
// invia una mail di "guida pratica" (3 passi concreti + link al diario) nella
// lingua dell'utente e salva un record DormantReminder per la rendicontazione
// admin. Salta admin e utenti gia' contattati (anti-duplicato).

const USER_LIMIT = 500;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = Date.now();
    const windowStart = now - 72 * 3600 * 1000; // 72h fa
    const windowEnd = now - 48 * 3600 * 1000;  // 48h fa

    // Carica utenti (più recenti primi) e reminder gia' inviati
    const [users, existing] = await Promise.all([
      base44.asServiceRole.entities.User.filter({}, '-created_date', USER_LIMIT).catch(() => []),
      base44.asServiceRole.entities.DormantReminder.filter({}, '-sent_at', USER_LIMIT).catch(() => []),
    ]);

    const remindedIds = new Set((existing as any[]).map((r) => String(r.user_id)));

    const candidates = (users as any[]).filter((u) => {
      if (u.role === 'admin') return false;
      if (u.is_verified === false) return false; // salta solo se esplicitamente false
      if (!u.email) return false;
      if (remindedIds.has(String(u.id))) return false;
      const cd = u.created_date ? new Date(u.created_date).getTime() : 0;
      return cd >= windowStart && cd <= windowEnd;
    });

    const sent: any[] = [];
    const failed: any[] = [];

    for (const u of candidates) {
      // Verifica zero record tra le 5 entity
      const [symps, foods, meds, doses, recs] = await Promise.all([
        base44.asServiceRole.entities.SymptomEntry.filter({ created_by_id: u.id }, '-created_date', 1).catch(() => []),
        base44.asServiceRole.entities.FoodEntry.filter({ created_by_id: u.id }, '-created_date', 1).catch(() => []),
        base44.asServiceRole.entities.Medication.filter({ created_by_id: u.id }, '-created_date', 1).catch(() => []),
        base44.asServiceRole.entities.MedicationDose.filter({ created_by_id: u.id }, '-created_date', 1).catch(() => []),
        base44.asServiceRole.entities.MedicalRecord.filter({ created_by_id: u.id }, '-created_date', 1).catch(() => []),
      ]);
      if (symps.length || foods.length || meds.length || doses.length || recs.length) continue;

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