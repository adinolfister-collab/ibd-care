import { base44 } from '@/api/base44Client';
import { getVisitorId, getSessionId } from '@/lib/visitorSession';

// Registra l'attivita' di un ospite anonimo (demo mode): salvataggi del
// diario, interazioni demo di assistente/scanner/PDF e tentativi bloccati
// sui premium. Il dato persiste nell'entita' ConversionEvent (is_guest=true)
// via il backend function trackGuestActivity, cosi' e' consultabile da remoto
// nella sezione Ospiti di /admin/conversioni.
//
// Best-effort: errori silenziosi, non blocca mai l'azione dell'utente.
//   feature: 'symptom_write' | 'food_write' | 'med_write' | 'dose_write' |
//            'record_write' | 'community_post' | 'assistant_msg' |
//            'exam_scan' | 'pdf_export' | 'food_report' | 'chart_range' ...
//   source:  'used' (salvataggio diario) | 'demo' (interazione premium demo) |
//            'blocked' (paywall/registrazione aperta)
export function trackGuestActivity(feature, source) {
  if (!feature || !source) return;
  const payload = {
    feature,
    source,
    path: typeof window !== 'undefined' ? window.location.pathname : '',
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
  };
  try {
    base44.functions.invoke('trackGuestActivity', payload).catch(() => {});
  } catch (_) { /* noop */ }
}