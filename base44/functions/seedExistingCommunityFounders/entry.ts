import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  CAMPAIGN, assignRanks, grantFieldsForRank,
} from '../../shared/foundersCampaign.ts';

// Admin-only: seeds the Founder campaign with the authors of existing
// community messages. Each author gets a confirmed signup ranked by the
// date of their earliest message, and the matching Premium grant. This
// honours the decision to count current community members automatically.
// Idempotent — running it again skips authors who already have a signup.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const messages = await base44.asServiceRole.entities.CommunityMessage.list('-created_date', 1000) as any[];
    // earliest message per author
    // Group messages by author. Sample/synthetic messages share a fake
    // created_by_id ("ai_generated"), so fall back to the author name to
    // avoid collapsing distinct authors into a single signup.
    const byAuthor = new Map<string, { first: string; name: string }>();
    for (const m of messages) {
      const uid = m.created_by_id;
      if (!uid) continue;
      const key = (uid && uid !== 'ai_generated') ? uid : `name:${m.author_name || 'Utente'}`;
      const date = m.created_date;
      const prev = byAuthor.get(key);
      if (!prev || (date && date < prev.first)) {
        byAuthor.set(key, { first: date, name: m.author_name || 'Utente' });
      }
    }
    const authors = [...byAuthor.entries()].sort((a, b) => a[1].first < b[1].first ? -1 : 1);

    const existing = await base44.asServiceRole.entities.CampaignSignup.list('-rank', 500) as any[];
    const existingSignups = existing.filter((s) => s.campaign === CAMPAIGN);
    // Dedupe by both created_by_id (real users) and display_name (sample data)
    // so re-running the seed doesn't create duplicate signups.
    const existingAuthors = new Set(existingSignups.map((s) => s.created_by_id));
    const existingNames = new Set(existingSignups.map((s) => (s.display_name || '').toLowerCase()));

    let created = 0;
    for (const [key, info] of authors) {
      if (key.startsWith('name:')) {
        if (existingNames.has(info.name.toLowerCase())) continue;
      } else if (existingAuthors.has(key)) {
        continue;
      }
      await base44.asServiceRole.entities.CampaignSignup.create({
        campaign: CAMPAIGN,
        confirmed: true,
        first_message_date: info.first,
        display_name: info.name,
      } as any);
      if (key.startsWith('name:')) existingNames.add(info.name.toLowerCase());
      else existingAuthors.add(key);
      created++;
    }

    // Recompute ranks for all confirmed and apply grants.
    const all = await base44.asServiceRole.entities.CampaignSignup.list('-rank', 500) as any[];
    const confirmed = (all as any[]).filter((s) => s.campaign === CAMPAIGN && s.confirmed);
    const ranked = assignRanks(confirmed as any);
    if (ranked.length > 0) {
      await base44.asServiceRole.entities.CampaignSignup.bulkUpdate(
        ranked.map((r) => ({ id: r.id, rank: r.rank, slot_type: r.slot_type }))
      );
    }
    for (const r of ranked) {
      try {
        await base44.asServiceRole.entities.User.update(r.created_by_id, grantFieldsForRank(r.rank) as any);
      } catch (e) {
        console.error('seed grant failed for', r.created_by_id, e);
      }
    }

    return Response.json({ seeded: created, totalConfirmed: ranked.length });
  } catch (error) {
    console.error('seedExistingCommunityFounders', error);
    return Response.json({ error: 'Impossibile avviare la campagna' }, { status: 502 });
  }
}