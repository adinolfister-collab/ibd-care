import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  CAMPAIGN, LIFETIME_SLOTS, TOTAL_SLOTS, isCampaignFull,
} from '../../shared/foundersCampaign.ts';

// Public ranking for the Founder campaign. No login required: visitors can
// see the live leaderboard (display name, rank, slot type) and the remaining
// spots. If the caller is authenticated, their own signup is returned too.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const all = await base44.asServiceRole.entities.CampaignSignup.list('-rank', 500) as any[];
    const mine = all.filter((s) => s.campaign === CAMPAIGN);
    const confirmed = mine.filter((s) => s.confirmed).sort((a, b) => (a.rank || 0) - (b.rank || 0));
    const lifetimeCount = confirmed.filter((s) => s.slot_type === 'lifetime').length;
    const pending = mine.filter((s) => !s.confirmed).map((s) => ({
      display_name: s.display_name || 'Utente',
      is_me: !!(mySignup && mySignup.id === s.id),
    }));

    let mySignup: any = null;
    try {
      const user = await base44.auth.me();
      if (user) mySignup = mine.find((s) => s.created_by_id === user.id) || null;
    } catch { /* not authenticated — public view */ }

    return Response.json({
      ranking: confirmed.map((s) => ({
        rank: s.rank,
        display_name: s.display_name || 'Utente',
        slot_type: s.slot_type,
        is_me: !!(mySignup && mySignup.id === s.id),
      })),
      counts: {
        confirmed: confirmed.length,
        lifetime: lifetimeCount,
        total: TOTAL_SLOTS,
        lifetimeTotal: LIFETIME_SLOTS,
        lifetimeLeft: Math.max(0, LIFETIME_SLOTS - lifetimeCount),
        totalLeft: Math.max(0, TOTAL_SLOTS - confirmed.length),
        full: isCampaignFull(confirmed.length),
        pending: pending.length,
      },
      pending,
      mySignup: mySignup ? {
        rank: mySignup.rank,
        confirmed: mySignup.confirmed,
        slot_type: mySignup.slot_type,
      } : null,
    });
  } catch (error) {
    console.error('getFoundersRanking', error);
    return Response.json({ error: 'Impossibile caricare la classifica' }, { status: 502 });
  }
}