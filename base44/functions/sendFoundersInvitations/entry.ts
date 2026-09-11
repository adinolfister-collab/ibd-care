import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const recipients = Array.isArray(body?.recipients) ? body.recipients : [];
    const subject = (body?.subject || '').toString().trim();
    const text = (body?.text || '').toString().trim();

    if (!subject || !text) {
      return Response.json({ error: 'Subject and body are required' }, { status: 400 });
    }
    if (!recipients.length) {
      return Response.json({ error: 'No recipients selected' }, { status: 400 });
    }

    // Bound abuse: cap recipients per send
    const capped = recipients.slice(0, 200);

    const results = [];
    for (const r of capped) {
      const email = (r?.email || '').toString().trim();
      const name = (r?.name || '').toString().trim();
      if (!email) {
        results.push({ email, status: 'error', error: 'missing email' });
        continue;
      }
      try {
        const greeting = name ? `Gentile ${name},` : 'Gentile utente,';
        const fullText = `${greeting}\n\n${text}`;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject,
          text: fullText,
        });
        results.push({ email, status: 'ok' });
      } catch (e) {
        results.push({ email, status: 'error', error: e.message || 'send failed' });
      }
    }

    return Response.json({
      sent: results.filter((x) => x.status === 'ok').length,
      failed: results.filter((x) => x.status === 'error').length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}