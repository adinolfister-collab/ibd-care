import { base44 } from '@/api/base44Client';

// Registra un tentativo di accesso a una funzione premium da parte di un
// utente non abbonato. Doppio canale best-effort:
//   1) base44.analytics.track -> visibile nella dashboard analytics di Base44
//   2) ConversionEvent entity -> aggregato dal pannello admin in-app
// Non blocca mai l'UX: errori silenziosi.
export function trackPremiumAttempt(feature, source = 'route_guard') {
  try {
    base44.analytics.track({
      eventName: 'premium_feature_attempt',
      properties: { feature, source },
    });
  } catch (_) { /* noop */ }
  try {
    base44.entities.ConversionEvent.create({
      event_name: 'premium_feature_attempt',
      feature,
      source,
    });
  } catch (_) { /* noop */ }
}