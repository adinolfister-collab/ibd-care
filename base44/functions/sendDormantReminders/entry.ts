import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Promemoria inserimenti 48h (admin-only, invocato dal workflow giornaliero).
// Individua gli utenti verificati con created_date tra 48 e 72 ore fa e zero
// record tra SymptomEntry, FoodEntry, Medication, MedicationDose e MedicalRecord;
// invia una mail di "guida pratica" (3 passi concreti + link al diario) e salva
// un record DormantReminder per la rendicontazione admin. Salta admin e utenti
// gia' contattati (anti-duplicato). Nessun paywall/trial forzata nel messaggio.

const APP_URL = 'https://ibd-care.it';
const USER_LIMIT = 500;

function emailHtml(userName: string): string {
  const greeting = userName ? `Ciao ${userName}` : 'Ciao';
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f1ea;font-family:Inter,Arial,sans-serif;color:#1f3a3a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1ea;padding:24px 12px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7ddca;">
        <tr><td style="padding:28px 28px 8px 28px;">
          <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b07a4a;font-weight:600;">IBD Care · Rivista mediterranea</p>
          <h1 style="margin:0 0 12px 0;font-size:24px;font-family:Georgia,serif;color:#1f3a3a;font-weight:600;line-height:1.2;">Tutto pronto per il tuo primo inserimento</h1>
          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#4a5c5c;">${greeting}, abbiamo visto che ti sei iscritto a IBD Care ma non hai ancora registrato nulla nel diario. Nessuna fretta: ecco tre passi semplici per iniziare a capire come il tuo corpo risponde a cibo e sintomi.</p>
        </td></tr>
        <tr><td style="padding:0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:14px 0;border-top:1px solid #f0e9db;">
                <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#1f3a3a;">1 · Registra il primo pasto (30 secondi)</p>
                <p style="margin:0;font-size:14px;line-height:1.55;color:#4a5c5c;">Apri il diario alimentare e segna cosa hai mangiato a colazione o pranzo: bastano il nome dell'alimento e la quantità.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 0;border-top:1px solid #f0e9db;">
                <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#1f3a3a;">2 · Aggiungi il primo sintomo</p>
                <p style="margin:0;font-size:14px;line-height:1.55;color:#4a5c5c;">Annota come ti senti oggi: intensità, tipo di disturbo e note. Un solo tap e il dato è salvato.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 0;border-top:1px solid #f0e9db;">
                <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#1f3a3a;">3 · Scopri le correlazioni</p>
                <p style="margin:0;font-size:14px;line-height:1.55;color:#4a5c5c;">Con qualche pasto e sintomo registrati, IBD Care evidenzia automaticamente quali alimenti si associano ai tuoi fastidi. Più dati, più precisione.</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 28px 8px 28px;">
          <a href="${APP_URL}/food" style="display:inline-block;background:#1f3a3a;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:10px;">Apri il diario alimentare</a>
        </td></tr>
        <tr><td style="padding:8px 28px 28px 28px;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#8a9a9a;">Hai una domanda? Rispondi a questa email o apri la sezione Supporto dentro l'app. Il team di IBD Care è qui per te.<br/><br/>— Il team IBD Care</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0 0;font-size:11px;color:#9aa8a8;">Hai ricevuto questa email perché sei registrato su IBD Care.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailText(userName: string): string {
  const greeting = userName ? `Ciao ${userName}` : 'Ciao';
  return `${greeting},

Ti sei iscritto a IBD Care ma non hai ancora registrato nulla nel diario. Ecco tre passi semplici per iniziare:

1. Registra il primo pasto (30 secondi): apri il diario alimentare e segna cosa hai mangiato.
2. Aggiungi il primo sintomo: annota come ti senti oggi con un tap.
3. Scopri le correlazioni: con qualche dato, IBD Care evidenzia gli alimenti associati ai tuoi fastidi.

Apri il diario: ${APP_URL}/food

Hai una domanda? Rispondi a questa email o apri Supporto dentro l'app.

— Il team IBD Care`;
}

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
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject: 'Tutto pronto per il tuo primo inserimento su IBD Care',
          html: emailHtml(displayName),
          text: emailText(displayName),
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