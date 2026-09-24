import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Registra una page-view (beacon lato client) arricchita con il paese del
// visitatore, ricavato lato server dall'IP. Aperto ai visitatori anonimi:
// usa il service role per creare il record (nessun auth richiesta).

const geoCache = new Map();

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-client-ip') ||
    ''
  );
}

function isPrivate(ip: string): boolean {
  if (!ip || ip === 'unknown' || ip === '::1') return true;
  const v = ip.split('.').map(Number);
  if (v.length !== 4 || v.some((n) => Number.isNaN(n))) return false;
  return (
    v[0] === 10 ||
    v[0] === 127 ||
    v[0] === 0 ||
    (v[0] === 172 && v[1] >= 16 && v[1] <= 31) ||
    (v[0] === 192 && v[1] === 168)
  );
}

async function lookupCountry(ip: string): Promise<string> {
  if (!ip || isPrivate(ip)) return 'Unknown';
  if (geoCache.has(ip)) return geoCache.get(ip);
  let country = 'Unknown';
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3000);
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: ctrl.signal });
    if (res.ok) {
      const j: any = await res.json();
      if (j && j.country_name) country = j.country_name;
    }
  } catch (_) {
    /* timeout / network — keep Unknown */
  } finally {
    clearTimeout(t);
  }
  geoCache.set(ip, country);
  if (geoCache.size > 2000) geoCache.clear();
  return country;
}

const VALID_SECTIONS = new Set([
  'Home', 'Diario', 'Negozio', 'Community', 'Abbonamento', 'Account', 'Altro',
]);

export default async function(req: Request): Promise<Response> {
  try {
    let p: any = {};
    try { p = await req.json(); } catch (_) { /* no body */ }
    const sessionId = String(p.session_id || '');
    if (!sessionId) {
      return Response.json({ ok: false, error: 'no session' }, { status: 400 });
    }
    let section = String(p.section || 'Altro');
    if (!VALID_SECTIONS.has(section)) section = 'Altro';
    const userId = p.user_id ? String(p.user_id) : '';
    const enteredAt = p.entered_at ? String(p.entered_at) : new Date().toISOString();
    const path = p.path ? String(p.path).slice(0, 200) : '';
    const visitorId = p.visitor_id ? String(p.visitor_id).slice(0, 64) : '';
    const referrer = p.referrer ? String(p.referrer).slice(0, 200) : 'Direct';
    const deviceRaw = String(p.device || 'desktop');
    const device = ['desktop', 'mobile', 'tablet'].includes(deviceRaw) ? deviceRaw : 'desktop';

    const base44 = createClientFromRequest(req);
    const ip = clientIp(req);
    const country = await lookupCountry(ip);

    await base44.asServiceRole.entities.PageView.create({
      session_id: sessionId,
      visitor_id: visitorId,
      section,
      path,
      referrer,
      device,
      country,
      entered_at: enteredAt,
      user_id: userId,
    });

    return Response.json({ ok: true, country });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 }
    );
  }
}