import { base44 } from '@/api/base44Client';

// Registra l'uso (o il tentativo bloccato) di una funzione a valore durante il
// trial o dopo la scadenza, per decidere data-driven quali funzioni mantenere
// bloccate a scadenza. Doppio canale best-effort, errori silenziosi:
//   1) base44.analytics.track → dashboard analytics
//   2) ConversionEvent entity  → pannello admin in-app (AdminConversions)
//
// action: 'used' (funzione usata durante il trial) | 'blocked' (tentativo
// bloccato dopo scadenza). L'ospite non emette eventi: vede la GuestSignupCard
// e nessuna azione è possibile.
export function trackTrialFeature(feature, action) {
  if (!feature) return;
  try {
    base44.analytics.track({
      eventName: 'trial_feature_used',
      properties: { feature, action },
    });
  } catch (_) { /* noop */ }
  try {
    base44.entities.ConversionEvent.create({
      event_name: 'trial_feature_used',
      feature,
      source: action,
    });
  } catch (_) { /* noop */ }
}