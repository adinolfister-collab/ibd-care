import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { mapPathToSection } from '@/lib/pageSections';
import { getVisitorId, getSessionId } from '@/lib/visitorSession';

// Beacon globale: ad ogni cambio rotta registra una page-view (paese ricavato
// lato server). Fire-and-forget: non blocca la navigazione. Traccia sia
// visitatori anonimi sia loggati.

// Account admin da escludere da tutte le metriche di tracciamento
// (da oggi in avanti; lo storico gia' registrato resta nei report).
const EXCLUDED_ADMIN_ID = '6a80de4be246a7b03417c239';

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

export default function PageViewBeacon() {
  const location = useLocation();
  const { user } = useAuth();
  const lastPath = useRef('');

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    // Non tracciare le visite dell'account admin escluso
    if (user?.id === EXCLUDED_ADMIN_ID) return;
    // Non tracciare il traffico interno: anteprima del builder (iframe) o
    // visite provenienti da base44.com
    try {
      if (window.self !== window.top) return;
      if (/(^|\.)base44\.com$/.test(new URL(document.referrer).host)) return;
    } catch (_) { /* referrer assente o iframe cross-origin */ }

    const section = mapPathToSection(path);
    const sessionId = getSessionId();
    const payload = {
      section,
      path,
      session_id: sessionId,
      visitor_id: getVisitorId(),
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