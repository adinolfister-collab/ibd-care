// Shared visitor/session identity for client-side tracking. Same logic and
// localStorage keys as PageViewBeacon, extracted here so guest-activity
// tracking and page-view tracking share a single source of truth.

const SESSION_KEY = 'ibd_session_id';
const SESSION_TS_KEY = 'ibd_session_ts';
const VISITOR_KEY = 'ibd_visitor_id';
const GAP_MS = 30 * 60 * 1000; // 30 min di inattivita' -> nuova sessione

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

export function getSessionId() {
  try {
    const now = Date.now();
    const id = localStorage.getItem(SESSION_KEY);
    const ts = Number(localStorage.getItem(SESSION_TS_KEY) || 0);
    if (!id || now - ts > GAP_MS) {
      const newId = randomId();
      localStorage.setItem(SESSION_KEY, newId);
      localStorage.setItem(SESSION_TS_KEY, String(now));
      return newId;
    }
    localStorage.setItem(SESSION_TS_KEY, String(now));
    return id;
  } catch {
    return randomId();
  }
}