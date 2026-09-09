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

    // … plus active community participants who never formally joined the
    // campaign. They appear in the ranking as "in attesa" based on their
    // earliest community message, so people like Esposito are visible even
    // without a confirmed CampaignSignup.
    const knownUserIds = new Set<string>();
    const knownNames = new Set<string>();
    for (const s of mine) {
      if (s.created_by_id && s.created_by_id !== 'ai_generated') knownUserIds.add(s.created_by_id);
      if (s.display_name) knownNames.add((s.display_name || '').toLowerCase());
    }
    const provisional: any[] = [];
    try {
      const messages = await base44.asServiceRole.entities.CommunityMessage.list('-created_date', 500) as any[];
      const byAuthor = new Map<string, { name: string; first: string }>();
      for (const m of messages) {
        const uid = m.created_by_id;
        const key = (uid && uid !== 'ai_generated') ? uid : `name:${m.author_name || 'Utente'}`;
        const date = m.created_date;
        const prev = byAuthor.get(key);
        if (!prev || (date && date < prev.first)) {
          byAuthor.set(key, { name: m.author_name || 'Utente', first: date });
        }
      }
      for (const [key, info] of byAuthor) {
        if (key.startsWith('name:')) {
          if (knownNames.has(info.name.toLowerCase())) continue;
        } else if (knownUserIds.has(key)) {
          continue;
        }
        provisional.push({
          display_name: info.name,
          first_message_date: info.first,
          is_me: key === myUserId,
        });
      }
      provisional.sort((a, b) => ((a.first_message_date || '') < (b.first_message_date || '') ? -1 : 1));
    } catch (e) { console.error('community authors scan', e); }

    const pending = [...pendingSignup, ...provisional];

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