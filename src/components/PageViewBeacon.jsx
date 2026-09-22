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
const GAP_MS = 30 * 60 * 1000; // 30 min di inattivita' -> nuova sessione

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
      session_id: sessionId,
      entered_at: new Date().toISOString(),
      user_id: user?.id || '',
    };
    // fire-and-forget
    base44.functions.invoke('trackPageView', payload).catch(() => {});
  }, [location.pathname, user?.id]);

  return null;
}