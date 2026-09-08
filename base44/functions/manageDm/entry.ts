import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, to_user_id, to_user_name, conversation_id } = body || {};

    if (action === 'send') {
      if (!to_user_id) return Response.json({ error: 'to_user_id mancante' }, { status: 400 });
      if (to_user_id === user.id) return Response.json({ error: 'Non puoi scrivere a te stesso' }, { status: 400 });

      // Cerca conversazione esistente tra i due (RLS: l'utente vede solo le proprie)
      const existing = await base44.entities.DirectMessageConversation.filter({
        $or: [
          { participant_a_id: user.id, participant_b_id: to_user_id },
          { participant_a_id: to_user_id, participant_b_id: user.id }
        ]
      });
      const conv = existing[0];
      if (conv) {
        return Response.json({ conversation_id: conv.id, status: conv.status, existed: true });
      }

      const created = await base44.entities.DirectMessageConversation.create({
        participant_a_id: user.id,
        participant_b_id: to_user_id,
        participant_a_name: user.full_name || 'Utente',
        participant_b_name: to_user_name || 'Utente',
        status: 'pending'
      });

      // Notifica il destinatario (service role: creo per un altro utente)
      await base44.asServiceRole.entities.Notification.create({
        user_id: to_user_id,
        type: 'dm_request',
        title: user.full_name || 'Utente',
        body: 'Nuova richiesta di conversazione',
        link: '/community',
        payload: { conversation_id: created.id, from_user_id: user.id },
        read: false
      });

      return Response.json({ conversation_id: created.id, status: 'pending', existed: false });
    }

    if (action === 'accept' || action === 'reject') {
      if (!conversation_id) return Response.json({ error: 'conversation_id mancante' }, { status: 400 });
      const conv = await base44.entities.DirectMessageConversation.get(conversation_id);
      if (!conv) return Response.json({ error: 'Conversazione non trovata' }, { status: 404 });
      // Solo il destinatario (participant_b) puo accettare/rifiutare
      if (conv.participant_b_id !== user.id) {
        return Response.json({ error: 'Non autorizzato' }, { status: 403 });
      }
      if (action === 'accept') {
        await base44.entities.DirectMessageConversation.update(conversation_id, { status: 'active' });
      } else {
        await base44.entities.DirectMessageConversation.delete(conversation_id);
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (error) {
    console.error('manageDm', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}