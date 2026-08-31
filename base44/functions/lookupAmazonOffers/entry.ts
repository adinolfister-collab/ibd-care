// Sincronizzazione offerte Amazon via Product Advertising API (PA API 5).
// Scaffold pronto per l'attivazione: se le secret PA API non sono configurate
// (account Amazon non ancora approvato) restituisce ok:false con l'elenco
// delle secret mancanti, senza crashare, come syncAwinOffers/syncMyLeadPrograms.
// Quando Amazon approva (dopo 3 vendite idonee) e l'admin inserisce le chiavi,
// itera i Product attivi, chiama SearchItems per recuperare prezzo e DetailPageURL
// con il tag affiliato, upserta AffiliateOffer (source='amazon', store_name
// 'Amazon') e soft-delete quelle non piu' disponibili. Admin-only.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const SERVICE = 'ProductAdvertisingAPI';
const REGION = 'eu-west-1';
const HOST = 'webservices.amazon.it';
const ENDPOINT = `https://${HOST}/paapi5/searchitems`;
const MARKETPLACE = 'www.amazon.it';
const PARTNER_TYPE = 'Associates';
const STORE_NAME = 'Amazon';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

const enc = encodeURIComponent;
function uriEncode(s) { return encodeURIComponent(String(s)); }
function bufToHex(buf) {
  const b = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < b.length; i++) out += b[i].toString(16).padStart(2, '0');
  return out;
}

async function sha256Hex(data) {
  const buf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const h = await crypto.subtle.digest('SHA-256', buf);
  return bufToHex(h);
}

async function hmacBuf(key, msg) {
  const k = key instanceof ArrayBuffer ? key : new TextEncoder().encode(String(key));
  const m = new TextEncoder().encode(msg);
  const ik = await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return await crypto.subtle.sign('HMAC', ik, m);
}

// AWS Signature v4 per PA API 5 (POST JSON, x-amz-target header).
async function awsSigV4({ body, accessKey, secretKey, amzTarget }) {
  const t = new Date();
  const amzDate = t.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const headers = {
    'content-type': 'application/json; charset=UTF-8',
    host: HOST,
    'x-amz-date': amzDate,
    'x-amz-target': amzTarget,
  };
  const headerKeys = Object.keys(headers).sort();
  const canonicalHeaders = headerKeys.map((k) => `${k}:${String(headers[k]).trim()}\n`).join('');
  const signedHeaders = headerKeys.join(';');
  const payloadHash = await sha256Hex(body);
  const canonicalRequest = [
    'POST', '/', '', canonicalHeaders, signedHeaders, payloadHash,
  ].join('\n');
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256Hex(canonicalRequest)].join('\n');
  const kDate = await hmacBuf('AWS4' + secretKey, dateStamp);
  const kRegion = await hmacBuf(kDate, REGION);
  const kService = await hmacBuf(kRegion, SERVICE);
  const kSigning = await hmacBuf(kService, 'aws4_request');
  const signature = bufToHex(await hmacBuf(kSigning, stringToSign));
  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return { ...headers, authorization: authHeader };
}

async function searchItems({ keywords, partnerTag, accessKey, secretKey }) {
  const payload = {
    PartnerTag: partnerTag,
    PartnerType: PARTNER_TYPE,
    Marketplace: MARKETPLACE,
    Keywords: keywords,
    SearchIndex: 'All',
    ItemCount: 1,
    ItemPage: 1,
    Resources: [
      'ItemInfo.Title',
      'Images.Primary.Small',
      'Offers.Listings.Price',
      'Offers.Listings.SavingBasis',
    ],
  };
  const body = JSON.stringify(payload);
  const headers = await awsSigV4({ body, accessKey, secretKey, amzTarget: 'com.amazon.paapi5.v1.ProductSearchService.SearchItems' });
  const res = await fetchWithTimeout(ENDPOINT, { method: 'POST', headers, body }, 15000);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  if (!res.ok) {
    const err = json?.Errors?.[0] || {};
    throw new Error(`PA API HTTP ${res.status}: ${err.Code || ''} ${err.Message || text.slice(0, 200)}`);
  }
  if (json?.Errors?.length) {
    const e = json.Errors[0];
    throw new Error(`PA API: ${e.Code || ''} ${e.Message || ''}`);
  }
  const item = json?.SearchResult?.Items?.[0];
  if (!item) return null;
  const listing = item.Offers?.Listings?.[0];
  const price = listing?.Price?.Amount;
  const detailUrl = item.DetailPageURL;
  const title = item.ItemInfo?.Title?.DisplayValue;
  const image = item.Images?.Primary?.Small?.URL;
  return {
    asin: item.ASIN,
    price: typeof price === 'number' ? price : undefined,
    detail_url: detailUrl,
    title,
    image_url: image,
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = !!(body.dry_run);

    const accessKey = secrets.get('AMAZON_ACCESS_KEY');
    const secretKey = secrets.get('AMAZON_SECRET_KEY');
    const partnerTag = secrets.get('AMAZON_PARTNER_TAG');
    const associateTag = secrets.get('AMAZON_ASSOCIATE_TAG') || partnerTag;
    const missing = [];
    if (!accessKey) missing.push('AMAZON_ACCESS_KEY');
    if (!secretKey) missing.push('AMAZON_SECRET_KEY');
    if (!partnerTag) missing.push('AMAZON_PARTNER_TAG');

    if (missing.length || dryRun) {
      return Response.json({
        ok: missing.length === 0,
        missing,
        paused: !associateTag ? 'In attesa di approvazione Amazon (3 vendite idonee).' : null,
        message: missing.length
          ? 'PA API non ancora configurata. Inserisci le chiavi in Settings → Secrets dopo l\'approvazione di Amazon Associates.'
          : 'PA API configurata.',
        synced_at: new Date().toISOString(),
      });
    }

    const tag = associateTag;
    const products = await base44.asServiceRole.entities.Product.list('-updated_date', 1000) || [];
    const active = products.filter((p) => p.active !== false);

    const seen = new Set();
    let offersCreated = 0;
    let productsUpdated = 0;
    const errors = [];
    const limit = Math.min(Math.max(parseInt(body.limit, 10) || 200, 1), 500);
    let count = 0;

    for (const p of active) {
      if (count >= limit) break;
      const keywords = (p.query || p.name || '').trim();
      if (!keywords) continue;
      count++;
      if (count > 1) await sleep(1100); // PA API throttle ~1 req/s
      try {
        const found = await searchItems({ keywords, partnerTag: tag, accessKey, secretKey });
        if (!found || typeof found.price !== 'number' || !found.detail_url) {
          continue;
        }
        // Assicura il tag affiliato nel DetailPageURL
        let affUrl = found.detail_url;
        try {
          const u = new URL(affUrl);
          u.searchParams.set('tag', tag);
          u.searchParams.set('linkCode', 'll1');
          affUrl = u.toString();
        } catch { /* keep raw */ }
        const payload = {
          product_id: p.id,
          store_name: STORE_NAME,
          store_price: found.price,
          affiliate_url: affUrl,
          image_url: found.image_url || undefined,
          title: found.title || undefined,
          source: 'amazon',
        };
        await base44.asServiceRole.entities.AffiliateOffer.deleteMany({ product_id: p.id, source: 'amazon', store_name: STORE_NAME });
        await base44.asServiceRole.entities.AffiliateOffer.create(payload);
        offersCreated++;
        productsUpdated++;
        seen.add(p.id);
      } catch (e) {
        errors.push({ product: p.id, name: p.name, error: (e && e.message) || String(e) });
      }
    }

    // Soft-delete delle offerte amazon orfane (prodotto non piu' trovato/attivo)
    try {
      const existing = await base44.asServiceRole.entities.AffiliateOffer.filter({ source: 'amazon', store_name: STORE_NAME }, '-updated_date', 500) || [];
      const orphan = existing.filter((o) => !seen.has(o.product_id)).map((o) => o.id);
      if (orphan.length) await base44.asServiceRole.entities.AffiliateOffer.deleteMany({ id: { $in: orphan } });
    } catch (e) {
      errors.push({ stage: 'cleanup', error: (e && e.message) || String(e) });
    }

    return Response.json({
      ok: true,
      missing: [],
      offers_created: offersCreated,
      products_updated: productsUpdated,
      errors,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: (error && error.message) || 'sync error' }, { status: 500 });
  }
}