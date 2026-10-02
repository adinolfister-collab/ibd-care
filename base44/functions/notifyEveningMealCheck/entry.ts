import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { getLang, DICT } from '../../shared/backendI18n.ts';

// Promemoria serale (21:00 Europe/Rome) per registrare le reazioni ai pasti
// della giornata. Invia a utenti con notifications_enabled !== false.
// Crea un record Notification (visibile in-app) e tenta un push (best-effort,
// funziona dopo la build nativa con credenziali push).
// Admin-only: richiamato dal workflow EveningMealCheck (scheduled).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const u of users) {
      if (u.notifications_enabled === false) { skipped++; continue; }
      const lang = await getLang(base44, u.id);
      const T = DICT.mealCheck[lang];
      try {
        await base44.asServiceRole.entities.Notification.create({
          user_id: u.id,
          type: 'meal_check',
          title: T.title,
          body: T.body,
          link: '/food',
        });
        try {
          await base44.asServiceRole.integrations.Core.SendPushNotification({
            user_id: u.id,
            title: T.title,
            content: T.body,
            action_label: T.actionLabel,
            action_url: '/food',
          });
        } catch (e) {
          /* push non disponibile senza build nativa: ignorato, la notifica in-app resta */
        }
        sent++;
      } catch (e) {
        errors.push(String((e && e.message) || e));
      }
    }

    return Response.json({ sent, skipped, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}