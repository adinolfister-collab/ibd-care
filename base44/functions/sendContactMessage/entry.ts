import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Notifica email al team (opzionale: il ticket viene salvato nel database
// e gestito dalla schermata admin /admin/supporto).
const CONTACT_TO = 'adinolfister@gmail.com';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? '').toString().trim();
    const email = (body?.email ?? '').toString().trim();
    const message = (body?.message ?? '').toString().trim();
    const subject = (body?.subject ?? '').toString().trim();
    const ALLOWED_REASONS = ['tecnico', 'account', 'domanda', 'feedback', 'abbonamento', 'altro'];
    const reason = ALLOWED_REASONS.includes(body?.reason) ? body.reason : 'altro';

    if (!name || !email || !message) {
      return Response.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Email non valida' }, { status: 400 });
    }
    if (message.length > 5000) {
      return Response.json({ error: 'Messaggio troppo lungo' }, { status: 400 });
    }

    // Crea il ticket nel database. Per gli utenti autenticati usa il client
    // user-scoped (cosi created_by_id viene impostato e l'utente puo vedere
    // il ticket in "Le mie richieste"). Per gli ospiti usa il service role.
    const ticketData = {
      name,
      email,
      message,
      subject: subject || message.slice(0, 80),
      reason,
      status: 'open' as const,
      source: 'contact' as const,
    };

    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {
      // ospite non autenticato
    }

    if (user) {
      await base44.entities.SupportTicket.create(ticketData);
    } else {
      await base44.asServiceRole.entities.SupportTicket.create(ticketData);
    }

    // Notifica email al team (breve, punta alla schermata admin)
    const notifySubject = `Nuovo ticket di supporto — ${name}`;
    const notifyText =
      `Hai ricevuto un nuovo messaggio di supporto da IBD Care.\n\n` +
      `Nome: ${name}\n` +
      `Email: ${email}\n\n` +
      `Messaggio:\n${message}\n\n` +
      `Rispondi dalla schermata admin: /admin/supporto\n`;
    const notifyHtml =
      `<div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#1a2e2e">` +
      `<h2 style="color:#2f5d62">Nuovo ticket di supporto</h2>` +
      `<p><strong>Nome:</strong> ${escapeHtml(name)}<br/>` +
      `<strong>Email:</strong> ${escapeHtml(email)}</p>` +
      `<p style="white-space:pre-wrap;border-left:3px solid #c9745b;padding-left:12px">${escapeHtml(message)}</p>` +
      `<p style="font-size:13px;color:#666">Rispondi dalla <a href="https://ibd-care.it/admin/supporto" style="color:#2f5d62">schermata admin</a>.</p>` +
      `</div>`;

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: CONTACT_TO,
        subject: notifySubject,
        text: notifyText,
        html: notifyHtml,
        from_name: 'IBD Care — Contatti',
      });
    } catch (_) {
      // La notifica email e facoltativa: il ticket e gia salvato nel database.
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendContactMessage error', error?.message || error);
    return Response.json({ error: error?.message || 'Errore invio messaggio' }, { status: 500 });
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