// Segnalazione crash lato client: usata dall'Error Boundary globale e dai
// listener window.onerror / unhandledrejection. Fire-and-forget: non blocca
// il rendering del fallback. Riutilizza gli stessi id visitatore/sessione
// del PageViewBeacon per correlare i crash alle visite.

import { base44 } from '@/api/base44Client';

const VISITOR_KEY = 'ibd_visitor_id';
const SESSION_KEY = 'ibd_session_id';
const SESSION_TS_KEY = 'ibd_session_ts';
const GAP_MS = 30 * 60 * 1000; // 30 min di inattivita' -> nuova sessione
// Account admin builder da escludere dai report (come PageView).
const EXCLUDED_ADMIN_ID = '6a80de4be246a7b03417c238';

let currentUser = null;
let installed = false;
let lastReportKey = '';
let lastReportTs = 0;

// AuthContext aggiorna qui l'utente corrente, cosi' il crash reporter (che
// vive fuori dal context) puo' allegare user_id e saltare l'admin builder.
export function setCrashUser(user) {
  currentUser = user || null;
}

function uuid() {
  try {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return uuid();
  }
}

function getSessionId() {
  try {
    const now = Date.now();
    const id = localStorage.getItem(SESSION_KEY);
    const ts = Number(localStorage.getItem(SESSION_TS_KEY) || 0);
    if (!id || now - ts > GAP_MS) {
      const newId = uuid();
      localStorage.setItem(SESSION_KEY, newId);
      localStorage.setItem(SESSION_TS_KEY, String(now));
      return newId;
    }
    localStorage.setItem(SESSION_TS_KEY, String(now));
    return id;
  } catch {
    return uuid();
  }
}

function detectDevice() {
  try {
    const ua = navigator.userAgent || '';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return 'tablet';
    if (/Mobi|iPhone|Android.*Mobile|Windows Phone/i.test(ua)) return 'mobile';
    return 'desktop';
  } catch {
    return 'desktop';
  }
}

export function reportCrash(error, extra) {
  try {
    const userId = currentUser?.id || '';
    // Non registrare i crash del builder.
    if (userId === EXCLUDED_ADMIN_ID) return;

    const message = String(error?.message || error || 'Unknown error').slice(0, 500);
    const stack = String(error?.stack || extra?.componentStack || '').slice(0, 4000);
    const path =
      typeof window !== 'undefined' && window.location?.pathname
        ? String(window.location.pathname).slice(0, 200)
        : '';

    // Throttle client-side: non risegnalare lo stesso message+path entro 30s.
    const key = message + '|' + path;
    const now = Date.now();
    if (key === lastReportKey && now - lastReportTs < 30000) return;
    lastReportKey = key;
    lastReportTs = now;

    const payload = {
      message,
      stack,
      path,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      user_id: userId,
      device: detectDevice(),
    };
    base44.functions.invoke('reportAppCrash', payload).catch(() => {});
  } catch {
    /* mai far crashare il crash reporter */
  }
}

// Listener globali per errori non di render (Promise reject, script error).
export function installGlobalErrorListeners() {
  if (installed) return;
  installed = true;
  try {
    window.addEventListener('error', (e) => {
      reportCrash(e.error || new Error(e.message || 'window error'));
    });
    window.addEventListener('unhandledrejection', (e) => {
      const reason = e.reason;
      reportCrash(
        reason && reason.message ? reason : new Error(String(reason || 'unhandled rejection'))
      );
    });
  } catch {}
}