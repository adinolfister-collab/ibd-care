import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getLangByEmail, DICT } from '../../shared/backendI18n.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const ticketId = (body?.ticket_id ?? '').toString().trim();
    const reply = (body?.reply ?? '').toString().trim();
    if (!ticketId || !reply) {
      return Response.json({ error: 'Parametri mancanti' }, { status: 400 });
    }
    if (reply.length > 5000) {
      return Response.json({ error: 'Risposta troppo lunga' }, { status: 400 });
    }

    // Recupera il ticket (service role per leggere qualsiasi ticket)
    const ticket = await base44.asServiceRole.entities.SupportTicket.get(ticketId);
    if (!ticket) {
      return Response.json({ error: 'Ticket non trovato' }, { status: 404 });
    }

    const now = new Date().toISOString();
    await base44.asServiceRole.entities.SupportTicket.update(ticketId, {
      reply,
      status: 'closed',
      replied_at: now,
    });

    // Lingua dell'autore del ticket (User per email, fallback 'it')
    const lang = await getLangByEmail(base44, ticket.email);
    const S = DICT.support[lang];
    const name = ticket.name || (lang === 'en' ? 'User' : 'Utente');

    // Invia email branded all'utente nella sua lingua
    const subject = S.subject;
    const textBody =
      `${S.greeting} ${name},\n\n` +
      `${S.intro}\n\n` +
      `---\n${reply}\n---\n\n` +
      `${S.myRequests}\n\n` +
      `${S.footer}\n`;

    const htmlBody =
      `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#1a2e2e">` +
      `<h2 style="color:#2f5d62">${escapeHtml(S.subject)}</h2>` +
      `<p>${escapeHtml(S.greeting)} ${escapeHtml(name)},</p>` +
      `<p>${escapeHtml(S.intro)}</p>` +
      `<div style="white-space:pre-wrap;border-left:3px solid #c9745b;padding-left:12px;background:#faf7f0;padding:12px 15px;border-radius:8px">${escapeHtml(reply)}</div>` +
      `<p style="font-size:13px;color:#666;margin-top:18px">${escapeHtml(S.myRequests)}</p>` +
      `<hr style="border:none;border-top:1px solid #e5e0d6;margin:20px 0"/>` +
      `<p style="font-size:12px;color:#888;white-space:pre-line">${escapeHtml(S.footer)}</p>` +
      `</div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: ticket.email,
      subject,
      text: textBody,
      html: htmlBody,
      from_name: S.fromName,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('replySupportTicket error', error?.message || error);
    const langErr = DICT.support.it;
    return Response.json({ error: error?.message || langErr.errSend }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}