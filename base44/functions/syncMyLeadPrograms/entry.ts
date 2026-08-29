import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Sincronizzazione programmi/offerte dal network MyLead.
// Recupera i programmi/deals via API (token MYLEAD_TOKEN), li mappa per categoria
// IBD Care (nutrizione/stomia/comfort/igiene) tramite keyword su nome/verticale,
// fa upsert su AffiliatePartner (source 'mylead') e disattiva quelli non più presenti.
// I programmi senza categoria abbinata o senza URL vengono saltati (filtro pertinenza).
// Admin-only; invocabile anche dal workflow schedulato MyLeadOffersSync.

const API_BASE = 'https://api.mylead.global/v1';

const CATEGORY_KEYWORDS = {
  nutrizione: ['nutr', 'supplement', 'vitamin', 'integrator', 'aliment', 'protein', 'nutri', 'dieta', 'cibo', 'sana'],
  stomia: ['stom', 'ostomy', 'barrier', 'pouch', 'wafer', 'sacca', 'sacchetto', 'monile', 'cutanea'],
  comfort: ['comfort', 'wellness', 'benessere', 'relax', 'sonno', 'riposo', 'dolor', 'calma', 'stress', 'relaxation'],
  igiene: ['igiene', 'hygiene', 'deterg', 'clean', 'sapone', 'igienizz', 'sanitizz', 'disinfet', 'care'],
};

function norm(s) { return String(s || '').toLowerCase().trim(); }

function matchCategory(name, vertical) {
  const blob = norm(name) + ' ' + norm(vertical);
  for (const cat of ['nutrizione', 'stomia', 'comfort', 'igiene']) {
    for (const kw of CATEGORY_KEYWORDS[cat]) {
      if (blob.includes(kw)) return cat;
    }
  }
  return null;
}

function pick(obj, names) {
  for (const n of names) {
    if (obj && obj[n] != null && String(obj[n]).trim()) return obj[n];
  }
  return undefined;
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.programs)) return data.programs;
  if (data && Array.isArray(data.deals)) return data.deals;
  if (data && Array.isArray(data.offers)) return data.offers;
  return [];
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = secrets.get('MYLEAD_TOKEN');
    if (!token) {
      return Response.json({
        ok: false,
        missing: ['MYLEAD_TOKEN'],
        message: 'Imposta MYLEAD_TOKEN in Settings → Secrets (MyLead → For Webmasters → API).',
        synced_at: new Date().toISOString(),
      });
    }

    // 1) Recupera programmi/deals MyLead (provo i path candidati comuni)
    const headers = { Authorization: 'Bearer ' + token, Accept: 'application/json' };
    let programs = [];
    let apiError = null;
    let usedPath = '';
    for (const path of ['/deals', '/programs', '/offers', '/programmes']) {
      try {
        const r = await fetch(API_BASE + path, { headers });
        if (r.ok) {
          programs = asArray(await r.json());
          usedPath = path;
          break;
        }
        if (r.status === 404) continue;
        apiError = 'HTTP ' + r.status;
        break;
      } catch (e) {
        apiError = (e && e.message) || String(e);
      }
    }

    if (apiError || !programs.length) {
      return Response.json({
        ok: false,
        missing: [],
        api_error: apiError || 'empty_or_unknown_shape',
        fetched: programs.length,
        used_path: usedPath || null,
        message: apiError
          ? ('MyLead API non raggiungibile: ' + apiError)
          : 'Nessun programma/deals restituito dalla API MyLead (verifica il token o i permessi).',
        synced_at: new Date().toISOString(),
      });
    }

    // 2) Mappa per categoria e prepara payload
    const fresh = {};
    let skipped = 0;
    for (const p of programs) {
      if (!p) continue;
      const name = String(pick(p, ['name', 'title', 'program_name', 'offer_name']) || '').trim();
      if (!name) { skipped++; continue; }
      const vertical = pick(p, ['category', 'vertical', 'niche', 'categories', 'subcategory']);
      const cat = matchCategory(name, vertical);
      if (!cat) { skipped++; continue; }
      let url = pick(p, ['affiliate_url', 'url', 'deeplink', 'tracking_url', 'link', 'redirect_url', 'click_url']);
      if (!url) { skipped++; continue; }
      if (!/^https?:\/\//i.test(String(url))) url = 'https://' + url;
      if (!fresh[name]) fresh[name] = { name, category: cat, affiliate_url: String(url), source: 'mylead', active: true };
    }
    const freshNames = Object.keys(fresh);

    // 3) Carica record esistenti MyLead e upsert
    const existing = await base44.asServiceRole.entities.AffiliatePartner.filter({ source: 'mylead' }, '-updated_date', 1000) || [];
    const byName = {};
    for (const e of existing) { if (e.name) byName[e.name] = e; }

    const toCreate = [];
    const toUpdate = [];
    for (const name of freshNames) {
      const f = fresh[name];
      const ex = byName[name];
      if (ex) {
        if (ex.category !== f.category || ex.affiliate_url !== f.affiliate_url || ex.active === false) {
          toUpdate.push({ id: ex.id, category: f.category, affiliate_url: f.affiliate_url, active: true });
        }
      } else {
        toCreate.push(f);
      }
    }

    let created = 0;
    let updated = 0;
    if (toCreate.length) {
      const r = await base44.asServiceRole.entities.AffiliatePartner.bulkCreate(toCreate);
      created = (r || []).length;
    }
    if (toUpdate.length) {
      await base44.asServiceRole.entities.AffiliatePartner.bulkUpdate(toUpdate);
      updated = toUpdate.length;
    }

    // 4) Disattiva programmi non più presenti (soft delete)
    let deactivated = 0;
    const staleIds = existing.filter((e) => e.name && !fresh[e.name] && e.active !== false).map((e) => e.id);
    if (staleIds.length) {
      try {
        await base44.asServiceRole.entities.AffiliatePartner.updateMany({ id: { $in: staleIds } }, { $set: { active: false } });
        deactivated = staleIds.length;
      } catch (e) {
        console.error('mylead deactivate failed', e && e.message);
      }
    }

    return Response.json({
      ok: true,
      missing: [],
      fetched: programs.length,
      used_path: usedPath,
      imported: freshNames.length,
      skipped,
      created,
      updated,
      deactivated,
      total: freshNames.length,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: (error && error.message) || 'sync error' }, { status: 500 });
  }
}