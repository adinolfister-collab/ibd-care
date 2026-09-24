import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { mapPathToSection } from '@/lib/pageSections';

// Beacon globale: ad ogni cambio rotta registra una page-view (paese ricavato
// lato server). Fire-and-forget: non blocca la navigazione. Traccia sia
// visitatori anonimi sia loggati.

const SESSION_KEY = 'ibd_session_id';
const SESSION_TS_KEY = 'ibd_session_ts';
const VISITOR_KEY = 'ibd_visitor_id';
const GAP_MS = 30 * 60 * 1000; // 30 min di inattivita' -> nuova sessione

function getOrCreateVisitor() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        (crypto && crypto.randomUUID && crypto.randomUUID()) ||
        Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
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

function detectReferrer() {
  try {
    const ref = document.referrer || '';
    if (!ref) return 'Direct';
    const host = new URL(ref).host;
    if (host === window.location.host) return 'Internal';
    return host;
  } catch {
    return 'Direct';
  }
}

function getOrCreateSession() {
  try {
    const now = Date.now();
    const id = localStorage.getItem(SESSION_KEY);
    const ts = Number(localStorage.getItem(SESSION_TS_KEY) || 0);
    if (!id || now - ts > GAP_MS) {
      const newId =
        (crypto && crypto.randomUUID && crypto.randomUUID()) ||
        Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem(SESSION_KEY, newId);
      localStorage.setItem(SESSION_TS_KEY, String(now));
      return newId;
    }
    localStorage.setItem(SESSION_TS_KEY, String(now));
    return id;
  } catch {
    // localStorage non disponibile (es. private mode) -> sessione ephemeral
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

export default function PageViewBeacon() {
  const location = useLocation();
  const { user } = useAuth();
  const lastPath = useRef('');

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const section = mapPathToSection(path);
    const sessionId = getOrCreateSession();
    const payload = {
      section,
      path,
      session_id: sessionId,
      visitor_id: getOrCreateVisitor(),
      referrer: detectReferrer(),
      device: detectDevice(),
      entered_at: new Date().toISOString(),
      user_id: user?.id || '',
    };
    // fire-and-forget
    base44.functions.invoke('trackPageView', payload).catch(() => {});
  }, [location.pathname, user?.id]);

  return null;
}