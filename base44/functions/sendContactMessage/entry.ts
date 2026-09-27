import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Destinatario fisso: l'indirizzo del team, non deriva dall'input utente.
const CONTACT_TO = 'adinolfister@gmail.com';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? '').toString().trim();
    const email = (body?.email ?? '').toString().trim();
    const message = (body?.message ?? '').toString().trim();

    if (!name || !email || !message) {
      return Response.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }
    // Validazione minima email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Email non valida' }, { status: 400 });
    }
    // Limite di lunghezza per evitare abusi
    if (message.length > 5000) {
      return Response.json({ error: 'Messaggio troppo lungo' }, { status: 400 });
    }

    const subject = `Nuovo messaggio da IBD Care — ${name}`;
    const textBody =
      `Hai ricevuto un nuovo messaggio dal form Contatti di IBD Care.\n\n` +
      `Nome: ${name}\n` +
      `Email: ${email}\n\n` +
      `Messaggio:\n${message}\n`;
    const htmlBody =
      `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#1a2e2e">` +
      `<h2 style="color:#2f5d62">Nuovo messaggio da IBD Care</h2>` +
      `<p><strong>Nome:</strong> ${escapeHtml(name)}<br/>` +
      `<strong>Email:</strong> ${escapeHtml(email)}</p>` +
      `<p style="white-space:pre-wrap;border-left:3px solid #c9745b;padding-left:12px">${escapeHtml(message)}</p>` +
      `<hr style="border:none;border-top:1px solid #e5e0d6;margin:20px 0"/>` +
      `<p style="font-size:12px;color:#888">Inviato dal form Contatti di IBD Care</p>` +
      `</div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: CONTACT_TO,
      subject,
      text: textBody,
      html: htmlBody,
      from_name: 'IBD Care — Contatti',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error?.message || 'Errore invio messaggio' }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}