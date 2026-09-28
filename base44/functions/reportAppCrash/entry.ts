import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';

// Riceve un report di crash dal client (Error Boundary globale o
// window.onerror/unhandledrejection). Pubblico (nessun auth): usa il service
// role per scrivere il record. Deduplica crash identici (message+path) entro
// 1 ora. Per il primo crash critico (pagine auth/revenue) invia email admin.

const CRITICAL_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/abbonamento',
]);
const DEDUPE_MS = 60 * 60 * 1000; // 1 ora
// Account admin builder da escludere dai report (come PageView).
const EXCLUDED_ADMIN_ID = '6a80de4be246a7b03417c238';

export default async function (req: Request): Promise<Response> {
  try {
    let p: any = {};
    try {
      p = await req.json();
    } catch (_) {
      /* no body */
    }
    const message = String(p.message || 'Unknown error').slice(0, 500);
    const stack = String(p.stack || '').slice(0, 4000);
    const path = String(p.path || '').slice(0, 200);
    const visitorId = String(p.visitor_id || '').slice(0, 64);
    const sessionId = String(p.session_id || '').slice(0, 64);
    const userId = String(p.user_id || '');
    const deviceRaw = String(p.device || 'desktop');
    const device = ['desktop', 'mobile', 'tablet'].includes(deviceRaw)
      ? deviceRaw
      : 'desktop';

    // Non registrare i crash del builder (inquinerebbero i report).
    if (userId === EXCLUDED_ADMIN_ID) {
      return Response.json({ ok: true, skipped: true });
    }

    const severity = CRITICAL_PATHS.has(path) ? 'critical' : 'normal';
    const base44 = createClientFromRequest(req);
    const now = new Date();
    const dedupeAfter = new Date(now.getTime() - DEDUPE_MS).toISOString();

    // Cerca un record recente con stesso message+path per la dedupe.
    const recent = await base44.asServiceRole.entities.AppCrash.filter(
      { message, path },
      '-last_seen',
      5
    );
    const dup = (recent || []).find(
      (r: any) => r.last_seen && r.last_seen >= dedupeAfter
    );

    let isFirst = false;
    if (dup) {
      await base44.asServiceRole.entities.AppCrash.update(dup.id, {
        count: (dup.count || 1) + 1,
        last_seen: now.toISOString(),
        device,
      });
    } else {
      isFirst = true;
      await base44.asServiceRole.entities.AppCrash.create({
        message,
        stack,
        path,
        visitor_id: visitorId,
        session_id: sessionId,
        user_id: userId,
        device,
        severity,
        count: 1,
        first_seen: now.toISOString(),
        last_seen: now.toISOString(),
        resolved: false,
      });
    }

    // Email di alert solo per il primo crash critico nella finestra di dedupe.
    if (isFirst && severity === 'critical') {
      waitUntil(
        (async () => {
          try {
            const admins = await base44.asServiceRole.entities.User.filter({
              role: 'admin',
            });
            const adminEmail = admins && admins[0] && admins[0].email;
            if (!adminEmail) return;
            const stackPreview = stack.slice(0, 800);
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: adminEmail,
              subject: `IBD Care — crash critico su ${path}`,
              text:
                'Un visitatore ha incontrato un errore su una pagina critica.\n\n' +
                'Pagina: ' + path + '\n' +
                'Messaggio: ' + message + '\n' +
                'Dispositivo: ' + device + '\n' +
                'Visitatore: ' + visitorId + '\n' +
                'Primo rilevamento: ' + now.toISOString() + '\n\n' +
                'Stack (anteprima):\n' + stackPreview,
            });
          } catch (_) {
            /* email fallita silenziosamente */
          }
        })()
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 }
    );
  }
}