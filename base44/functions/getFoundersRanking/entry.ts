import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  CAMPAIGN, LIFETIME_SLOTS, isCampaignFull,
} from '../../shared/foundersCampaign.ts';

// Public ranking for the Founder campaign. No login required: visitors can
// see the live leaderboard (display name, rank, slot type) and the remaining
// spots. If the caller is authenticated, their own signup is returned too.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const all = await base44.asServiceRole.entities.CampaignSignup.list('-rank', 500) as any[];
    const mine = all.filter((s) => s.campaign === CAMPAIGN);

    // Identify the current user up front (public view if not authenticated).
    let mySignup: any = null;
    let myUserId: string | null = null;
    try {
      const user = await base44.auth.me();
      if (user) {
        myUserId = user.id;
        mySignup = mine.find((s) => s.created_by_id === user.id) || null;
      }
    } catch { /* not authenticated — public view */ }

    const confirmed = mine.filter((s) => s.confirmed).sort((a, b) => (a.rank || 0) - (b.rank || 0));
    const lifetimeCount = confirmed.filter((s) => s.slot_type === 'lifetime').length;

    // Pending = explicit unconfirmed signups …
    const pendingSignup = mine.filter((s) => !s.confirmed).map((s) => ({
      display_name: s.display_name || 'Utente',
      first_message_date: s.first_message_date,
      is_me: !!(mySignup && mySignup.id === s.id),
    }));

    // Pending = only explicit unconfirmed signups (the community-message
    // confirmation step has been removed: join now confirms immediately, so
    // this list is normally empty).
    const pending = pendingSignup;

    return Response.json({
      ranking: confirmed.map((s) => ({
        rank: s.rank,
        display_name: s.display_name || 'Utente',
        slot_type: s.slot_type,
        referral_count: s.referral_count || 0,
        is_me: !!(mySignup && mySignup.id === s.id),
      })),
      counts: {
        confirmed: confirmed.length,
        lifetime: lifetimeCount,
        total: LIFETIME_SLOTS,
        lifetimeTotal: LIFETIME_SLOTS,
        lifetimeLeft: Math.max(0, LIFETIME_SLOTS - lifetimeCount),
        totalLeft: Math.max(0, LIFETIME_SLOTS - confirmed.length),
        full: isCampaignFull(confirmed.length),
        pending: pending.length,
      },
      pending,
      mySignup: mySignup ? {
        rank: mySignup.rank,
        confirmed: mySignup.confirmed,
        slot_type: mySignup.slot_type,
        referral_count: mySignup.referral_count || 0,
      } : null,
    });
  } catch (error) {
    console.error('getFoundersRanking', error);
    return Response.json({ error: 'Impossibile caricare la classifica' }, { status: 502 });
  }
}