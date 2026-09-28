import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  CAMPAIGN, TOTAL_SLOTS, assignRanks, grantFieldsForRank,
} from '../../shared/foundersCampaign.ts';

// A logged-in user joins the Founder campaign. The spot is CONFIRMED
// immediately at join (no community message required anymore): we set
// confirmed=true with first_message_date = join timestamp, recompute the
// ranks across all confirmed signups (ordered by first_message_date), persist
// rank/slot_type and write the Premium grant (lifetime / three_months) onto
// the user profile. Idempotent: joining again returns the existing signup.
// Closed once 50 spots are confirmed.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const all = await base44.asServiceRole.entities.CampaignSignup.list('-rank', 500) as any[];
    const mine = all.filter((s) => s.campaign === CAMPAIGN && s.created_by_id === user.id);

    // Already joined: return the current state.
    if (mine.length > 0) {
      const existing = mine[0];
      return Response.json({
        joined: true,
        confirmed: !!existing.confirmed,
        rank: existing.rank,
        slot_type: existing.slot_type,
      });
    }

    const confirmedCount = all.filter((s) => s.campaign === CAMPAIGN && s.confirmed).length;
    if (confirmedCount >= TOTAL_SLOTS) {
      return Response.json({ joined: false, full: true });
    }

    // Create and confirm the spot immediately.
    const now = new Date().toISOString();
    const created = await base44.entities.CampaignSignup.create({
      campaign: CAMPAIGN,
      confirmed: true,
      first_message_date: now,
      display_name: user.full_name || 'Utente',
    } as any);

    // Recompute ranks across all confirmed signups (ordered by first_message_date).
    const confirmedList = (all as any[])
      .filter((s) => s.campaign === CAMPAIGN && s.confirmed)
      .concat([created]);
    const ranked = assignRanks(confirmedList as any);
    if (ranked.length > 0) {
      await base44.asServiceRole.entities.CampaignSignup.bulkUpdate(
        ranked.map((r) => ({ id: r.id, rank: r.rank, slot_type: r.slot_type }))
      );
    }

    const mineRanked = ranked.find((r) => r.id === created.id);
    const rank = mineRanked?.rank || 1;
    const slotType = mineRanked?.slot_type || 'lifetime';
    await base44.asServiceRole.entities.User.update(user.id, grantFieldsForRank(rank) as any);

    return Response.json({ joined: true, confirmed: true, rank, slot_type: slotType });
  } catch (error) {
    console.error('joinFoundersCampaign', error);
    return Response.json({ error: 'Impossibile aderire alla campagna' }, { status: 502 });
  }
}