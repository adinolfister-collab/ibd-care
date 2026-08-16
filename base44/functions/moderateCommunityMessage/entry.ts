import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Solo i moderatori possono eseguire questa azione' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { message_id } = body || {};
    if (!message_id) return Response.json({ error: 'message_id mancante' }, { status: 400 });

    // Remove child replies first, then the message itself (service role bypasses RLS)
    try {
      const children = await base44.asServiceRole.entities.CommunityMessage.filter({ parent_id: message_id });
      for (const c of children) {
        try { await base44.asServiceRole.entities.CommunityMessage.delete(c.id); } catch (e) {}
      }
    } catch (e) {}
    await base44.asServiceRole.entities.CommunityMessage.delete(message_id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('moderateCommunityMessage', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}