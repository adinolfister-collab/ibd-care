import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Campaign "Invita un amico": attribuisce un referral dopo la conferma della
// registrazione. Chiamato dal client (AuthContext) con { referrer_id } quando
// l'utente appena autenticato ha un referral pending (localStorage).
//
// Logica (tutto server-side, autoritativa):
//   - invitee = auth.me(); se ha già referrer_id -> idempotente, esci.
//   - anti-abuso: referrer_id !== invitee.id, referrer deve esistere.
//   - imposta invitee.referrer_id = referrer_id (una sola volta).
//   - invitee: se non Premium, imposta free_until = now + 45 giorni (trial
//     estesa per l'amico invitato, invece dei 30 standard).
//   - referrer: se non Premium e referral_count < 3, estende free_until di
//     +7 giorni (max 3 estensioni, +21 giorni totali) e incrementa
//     referral_count sul suo CampaignSignup(campaign='invite_a_friend').
//   - analytics: 'referral_completed'.
//
// Riusa la stessa entità CampaignSignup dei Founder (campaign='invite_a_friend').

const CAMPAIGN = 'invite_a_friend';
const INVITEE_TRIAL_DAYS = 45;
const REFERRER_BONUS_DAYS = 7;
const MAX_REFERRALS = 3;
const DAY_MS = 86400000;
const PREMIUM_STATUSES = ['active', 'lifetime', 'three_months', 'past_due'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let referrerId: string | null = null;
    try {
      const body = await req.json();
      if (body && typeof body.referrer_id === 'string' && body.referrer_id.trim()) {
        referrerId = body.referrer_id.trim();
      }
    } catch { /* no body */ }

    if (!referrerId) return Response.json({ ok: false, reason: 'no_referrer' });
    // Anti self-referral.
    if (referrerId === user.id) return Response.json({ ok: false, reason: 'self_referral' });

    // Idempotenza: se l'invitee ha già un referrer_id attribuito, non riprocessare.
    if (user.referrer_id) {
      return Response.json({ ok: false, reason: 'already_attributed' });
    }

    // Verifica che il referrer esista.
    let referrer: any;
    try {
      referrer = await base44.asServiceRole.entities.User.get(referrerId);
    } catch (e) {
      return Response.json({ ok: false, reason: 'referrer_not_found' });
    }
    if (!referrer) return Response.json({ ok: false, reason: 'referrer_not_found' });

    // 1) Attribuisci il referral sull'invitee (referrer_id + trial 45gg).
    const inviteeIsPremium = PREMIUM_STATUSES.includes(user.subscription_status);
    const inviteeFreeUntil = new Date(Date.now() + INVITEE_TRIAL_DAYS * DAY_MS).toISOString();
    const inviteeUpdate: any = { referrer_id: referrerId };
    if (!inviteeIsPremium) {
      inviteeUpdate.free_until = inviteeFreeUntil;
    }
    await base44.asServiceRole.entities.User.update(user.id, inviteeUpdate as any);

    // 2) Estendi il trial del referrer (+7gg, max 3) se non è Premium.
    const referrerIsPremium = PREMIUM_STATUSES.includes(referrer.subscription_status);
    let referrerExtended = false;
    let referrerBonusDays = 0;
    if (!referrerIsPremium) {
      // Trova o crea il CampaignSignup del referrer per la campagna invite_a_friend.
      const all = await base44.asServiceRole.entities.CampaignSignup.list('-created_date', 500) as any[];
      let referrerSignup = all.find(
        (s) => s.campaign === CAMPAIGN && s.created_by_id === referrerId
      );
      if (!referrerSignup) {
        referrerSignup = await base44.entities.CampaignSignup.create({
          campaign: CAMPAIGN,
          confirmed: true,
          first_message_date: new Date().toISOString(),
          display_name: referrer.full_name || 'Ambassador',
          referral_count: 0,
        } as any);
      }
      const currentCount = referrerSignup.referral_count || 0;
      if (currentCount < MAX_REFERRALS) {
        // Calcola il nuovo free_until: se futuro somma 7gg, altrimenti now+7gg.
        let newFreeUntil: string;
        const existing = referrer.free_until ? new Date(referrer.free_until).getTime() : 0;
        const now = Date.now();
        if (existing && existing > now) {
          newFreeUntil = new Date(existing + REFERRER_BONUS_DAYS * DAY_MS).toISOString();
        } else {
          newFreeUntil = new Date(now + REFERRER_BONUS_DAYS * DAY_MS).toISOString();
        }
        await base44.asServiceRole.entities.User.update(referrerId, { free_until: newFreeUntil } as any);
        await base44.asServiceRole.entities.CampaignSignup.update(referrerSignup.id, {
          referral_count: currentCount + 1,
        } as any);
        referrerExtended = true;
        referrerBonusDays = REFERRER_BONUS_DAYS;
      }
    }

    // 3) Analytics (post-response, non bloccante).
    try {
      const { waitUntil } = await import('base44:runtime');
      waitUntil(base44.analytics.track({
        eventName: 'referral_completed',
        properties: {
          referrer_id: referrerId,
          invitee_id: user.id,
          referrer_extended: referrerExtended,
          referrer_bonus_days: referrerBonusDays,
          invitee_trial_days: inviteeIsPremium ? 0 : INVITEE_TRIAL_DAYS,
        },
      }));
    } catch { /* noop */ }

    return Response.json({
      ok: true,
      invitee_trial_days: inviteeIsPremium ? 0 : INVITEE_TRIAL_DAYS,
      referrer_extended: referrerExtended,
      referrer_bonus_days: referrerBonusDays,
    });
  } catch (error) {
    console.error('processInviteReferral', error);
    return Response.json({ error: 'Impossibile processare il referral' }, { status: 500 });
  }
}