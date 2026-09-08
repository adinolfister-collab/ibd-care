import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { CAMPAIGN, TOTAL_SLOTS } from '../../shared/foundersCampaign.ts';

// A logged-in user joins the Founder campaign. Creates a provisional
// (unconfirmed) signup; the spot is finalized when the user posts a message
// in the community (confirmFoundersSignup). Idempotent: joining again
// returns the existing signup. Closed once 250 spots are confirmed.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const all = await base44.asServiceRole.entities.CampaignSignup.list('-rank', 500) as any[];
    const mine = all.filter((s) => s.campaign === CAMPAIGN && s.created_by_id === user.id);
    if (mine.length > 0) {
      const existing = mine[0];
      return Response.json({
        joined: true,
        rank: existing.rank,
        confirmed: !!existing.confirmed,
        slot_type: existing.slot_type,
      });
    }

    const confirmedCount = all.filter((s) => s.campaign === CAMPAIGN && s.confirmed).length;
    if (confirmedCount >= TOTAL_SLOTS) {
      return Response.json({ joined: false, full: true });
    }

    const created = await base44.entities.CampaignSignup.create({
      campaign: CAMPAIGN,
      confirmed: false,
      display_name: user.full_name || 'Utente',
    } as any);

    return Response.json({
      joined: true,
      rank: created.rank,
      confirmed: false,
      slot_type: created.slot_type,
    });
  } catch (error) {
    console.error('joinFoundersCampaign', error);
    return Response.json({ error: 'Impossibile aderire alla campagna' }, { status: 502 });
  }
}