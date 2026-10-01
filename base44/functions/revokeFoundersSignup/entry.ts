import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  CAMPAIGN, LIFETIME_SLOTS, assignRanks,
} from '../../shared/foundersCampaign.ts';

// Admin-only: revokes a Founder from the campaign. Deletes the user's
// CampaignSignup, recomputes ranks across the remaining confirmed signups
// (ordered by first_message_date via assignRanks), bulk-updates the new
// ranks, re-syncs founder_rank on each remaining user's profile, and strips
// the Premium grant from the revoked user's profile (subscription_status ->
// 'none', founder_rank -> null, free_until -> null). The freed slot becomes
// available for the next eligible join.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();
    if (!admin || admin.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId = (body?.user_id ?? '').toString().trim();
    if (!targetUserId) {
      return Response.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    // Safety: never revoke yourself.
    if (targetUserId === admin.id) {
      return Response.json({ error: 'Non puoi revocare te stesso' }, { status: 400 });
    }

    // Load every confirmed founder signup.
    const all = await base44.asServiceRole.entities.CampaignSignup.list('-rank', 500) as any[];
    const confirmed = all.filter((s) => s.campaign === CAMPAIGN && s.confirmed);
    const targetSignup = confirmed.find((s) => String(s.created_by_id) === targetUserId);
    if (!targetSignup) {
      return Response.json({ error: 'Iscrizione Founder non trovata' }, { status: 404 });
    }

    // Delete the revoked signup.
    await base44.asServiceRole.entities.CampaignSignup.delete(targetSignup.id);

    // Recompute ranks on the remaining confirmed signups and persist them.
    const remaining = confirmed.filter((s) => s.id !== targetSignup.id);
    const ranked = assignRanks(remaining as any);
    if (ranked.length > 0) {
      await base44.asServiceRole.entities.CampaignSignup.bulkUpdate(
        ranked.map((r) => ({ id: r.id, rank: r.rank, slot_type: r.slot_type })),
      );
      // Re-sync founder_rank on each remaining user profile (max 10 users).
      await Promise.all(
        ranked.map((r) =>
          base44.asServiceRole.entities.User.update(String(r.created_by_id), {
            founder_rank: r.rank,
          } as any).catch(() => {}),
        ),
      );
    }

    // Strip the Premium lifetime grant from the revoked user.
    await base44.asServiceRole.entities.User.update(targetUserId, {
      subscription_status: 'none',
      founder_rank: null,
      free_until: null,
    } as any);

    return Response.json({
      success: true,
      revoked_user_id: targetUserId,
      freed_slots: LIFETIME_SLOTS - ranked.length,
      remaining_founders: ranked.length,
    });
  } catch (error) {
    console.error('revokeFoundersSignup', error?.message || error);
    return Response.json(
      { error: error?.message || 'Impossibile revocare il Founder' },
      { status: 502 },
    );
  }
}