import { secrets } from 'base44:runtime';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Lookup live delle offerte del programma affiliate marketing per un prodotto.
// Contratto: POST { query: string, limit?: number } -> { configured, offers, count, fetched_at }
// Le secret AFFILIATE_API_ENDPOINT / AFFILIATE_API_KEY / AFFILIATE_AFFILIATE_ID(opz.)
// Si aspetta un'API che restituisca una lista piatta di articoli; la normalizzazione
// qui sotto tollera' le forme piu' comuni. Per cambiare network basta aggiornare le secret.

function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return undefined;
}

function toNumber(v) {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v !== 'string') {
    if (v && typeof v === 'object') {
      const n = pick(v, ['amount', 'value', 'price']);
      if (n !== undefined) return toNumber(n);
    }
    return undefined;
  }
  // Estrae il primo gruppo numerico, gestendo separatori italiani/anglosassoni.
  let s = v.replace(/[^\d.,-]/g, ' ').trim();
  if (!s) return undefined;
  const hasComma = s.indexOf(',') !== -1;
  const hasDot = s.indexOf('.') !== -1;
  if (hasComma && hasDot) {
    // L'ultimo separatore e' il decimale.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) return undefined;
  const n = parseFloat(m[0]);
  return isFinite(n) ? n : undefined;
}

function normalizeOffers(data, affiliateId) {
  let list = [];
  if (Array.isArray(data)) list = data;
  else if (data) {
    list =
      pick(data, ['offers', 'products', 'items', 'results', 'data', 'list']) ||
      [];
    if (!Array.isArray(list)) list = [];
  }
  const out = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const storeName =
      pick(item, ['store_name', 'merchant', 'store', 'shop', 'seller', 'source', 'retailer', 'supplier']) ||
      pick(item, ['merchant_name', 'shop_name']);
    const price = toNumber(
      pick(item, ['store_price', 'price', 'sale_price', 'amount', 'value', 'current_price', 'final_price'])
    );
    let url = pick(item, ['affiliate_url', 'url', 'link', 'deep_link', 'product_url', 'offer_url', 'go_url']);
    const image = pick(item, ['image_url', 'image', 'thumbnail', 'img', 'picture']);
    const title = pick(item, ['title', 'name', 'product_name', 'productTitle']);
    if (!url || price === undefined || !storeName) continue;
    if (affiliateId && url.indexOf('affid=') === -1 && url.indexOf('affiliate_id=') === -1) {
      const sep = url.indexOf('?') === -1 ? '?' : '&';
      url = url + sep + 'affid=' + encodeURIComponent(affiliateId);
    }
    out.push({
      store_name: String(storeName),
      store_price: price,
      affiliate_url: String(url),
      image_url: image ? String(image) : undefined,
      title: title ? String(title) : undefined,
    });
  }
  return out;
}

export default async function(req) {
  try {
    // Solo gli amministratori possono invocare il lookup affiliate: la chiamata
    // usa le chiavi API dell'app verso un network esterno, quindi e' riservata.
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const query = (body?.query || '').toString().trim();
    if (!query) return Response.json({ error: 'query required' }, { status: 400 });
    const limit = Math.min(Math.max(parseInt(body?.limit, 10) || 25, 1), 50);

    const endpoint = secrets.get('AFFILIATE_API_ENDPOINT');
    const apiKey = secrets.get('AFFILIATE_API_KEY');
    const affiliateId = secrets.get('AFFILIATE_AFFILIATE_ID');

    if (!endpoint || !apiKey) {
      return Response.json({
        configured: false,
        offers: [],
        count: 0,
        message: 'API non configurata',
      });
    }

    const target = new URL(endpoint);
    target.searchParams.set('query', query);
    target.searchParams.set('limit', String(limit));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let res;
    try {
      res = await fetch(target.toString(), {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'X-API-Key': apiKey,
          Accept: 'application/json',
          'User-Agent': 'IBD-Care-Affiliate-Lookup/1.0',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      return Response.json(
        { error: 'affiliate_lookup_failed', message: 'Risposta network ' + res.status },
        { status: 502 }
      );
    }
    const data = await res.json().catch(() => null);

    let offers = normalizeOffers(data, affiliateId);
    offers.sort((a, b) => a.store_price - b.store_price);
    offers = offers.slice(0, limit);

    return Response.json({
      configured: true,
      offers,
      count: offers.length,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'lookup error' }, { status: 500 });
  }
}