import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { norm, toNumber, fetchWithTimeout, parseCsv, colIndex, matchProduct } from '../../shared/affiliateFeed.ts';
import { secrets } from 'base44:runtime';

// Sincronizzazione offerte affiliate dal network TradeTracker.
// Scarica un product feed CSV unificato (secret TRADTRACKER_FEED_URL),
// parsa con delimitatore auto-detect (il feed TradeTracker usa ';'),
// matcha ogni riga ai Product del catalogo via GTIN/EAN -> Product.query
// oppure nome normalizzato, e upserta AffiliateOffer con source='tradetracker'.
// Lo store_name e' derivato dall'host del productURL (es. 'eurofarmacia.it').
// Admin-only; invocabile anche dal workflow schedulato (pull: limit).

// Sceglie il delimitatore contando ';' vs ',' sulla prima riga.
function detectDelimiter(text) {
  const line = (text.slice(0, 4000).split(/\r?\n/)[0] || '');
  const semi = (line.match(/;/g) || []).length;
  const comma = (line.match(/,/g) || []).length;
  return semi > comma ? ';' : ',';
}

// Hostname dal productURL con strip 'www.'.
function hostFromUrl(url) {
  try {
    let s = String(url || '').trim();
    if (!s) return '';
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    let h = new URL(s).hostname.toLowerCase();
    if (h.startsWith('www.')) h = h.slice(4);
    return h;
  } catch { return ''; }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rowLimit = Math.min(Math.max(parseInt(body.row_limit, 10) || 12000, 100), 60000);

    const feedUrl = secrets.get('TRADTRACKER_FEED_URL');
    if (!feedUrl) {
      return Response.json({
        ok: false,
        missing: ['TRADTRACKER_FEED_URL'],
        message: 'Imposta TRADTRACKER_FEED_URL in Settings → Secrets (URL del feed CSV unificato TradeTracker).',
        synced_at: new Date().toISOString(),
      });
    }

    // 1) Carica il catalogo Product
    const products = await base44.asServiceRole.entities.Product.list('-updated_date', 1000) || [];
    const eanMap = {};
    const nameMap = {};
    for (const p of products) {
      if (p.query) {
        const k = String(p.query).trim();
        if (/^\d{6,}$/.test(k) && !eanMap[k]) eanMap[k] = p;
      }
      if (p.name) {
        const k = norm(p.name);
        if (k && !nameMap[k]) nameMap[k] = p;
      }
    }

    // 2) Scarica il feed unificato
    let res;
    try {
      res = await fetchWithTimeout(feedUrl, {}, 30000);
    } catch (e) {
      return Response.json({ ok: false, missing: [], error: 'feed_unreachable: ' + ((e && e.message) || String(e)) }, { status: 502 });
    }
    if (!res.ok) {
      return Response.json({ ok: false, missing: [], error: 'feed_http_' + res.status }, { status: 502 });
    }
    const text = await res.text();
    const delimiter = detectDelimiter(text);
    const rows = parseCsv(text, delimiter, rowLimit);
    if (rows.length < 2) {
      return Response.json({ ok: false, missing: [], message: 'Feed vuoto o non leggibile (delimitatore: ' + delimiter + ').' });
    }

    const h = rows[0];
    const iName = colIndex(h, ['name', 'product_name', 'title']);
    const iPrice = colIndex(h, ['price', 'search_price', 'store_price']);
    const iUrl = colIndex(h, ['productURL', 'product_url', 'url', 'aw_deep_link', 'deeplink']);
    const iImg = colIndex(h, ['imageURL', 'image_url', 'aw_image_url', 'merchant_image_url']);
    const iGtin = colIndex(h, ['GTIN', 'gtin', 'EAN', 'ean']);
    const iCampaign = colIndex(h, ['campaignID', 'campaign_id', 'campaign']);

    const freshByProduct = {};
    const advertisers = {}; // chiave campaignID (o store) -> count offerte
    let rowsRead = 0;
    let offersCreated = 0;
    const productsUpdated = new Set();
    const errors = [];

    for (let i = 1; i < rows.length && i <= rowLimit; i++) {
      rowsRead++;
      const row = rows[i];
      if (!row) continue;
      const url = row[iUrl];
      if (!url) continue;
      const price = toNumber(row[iPrice]);
      if (price === undefined) continue;
      const store = hostFromUrl(url);
      if (!store) continue;
      const rawEan = (row[iGtin] || '').toString().replace(/\s+/g, '');
      const ean = /^\d{6,}$/.test(rawEan) ? rawEan : '';
      const pname = row[iName] || '';
      const matched = matchProduct(ean, norm(pname), eanMap, nameMap, products);
      if (!matched.length) continue;
      const campaign = row[iCampaign] ? String(row[iCampaign]) : store;
      for (const prod of matched) {
        if (!freshByProduct[prod.id]) freshByProduct[prod.id] = {};
        const key = url;
        if (freshByProduct[prod.id][key]) continue;
        freshByProduct[prod.id][key] = {
          product_id: prod.id,
          store_name: store,
          store_price: price,
          affiliate_url: url,
          image_url: row[iImg] || undefined,
          title: pname || undefined,
          source: 'tradetracker',
        };
        advertisers[campaign] = (advertisers[campaign] || 0) + 1;
      }
    }

    // 3) Persisti: per ogni prodotto toccato, azzera le offerte TradeTracker e ricrea
    for (const pid in freshByProduct) {
      const offers = Object.values(freshByProduct[pid]);
      try {
        await base44.asServiceRole.entities.AffiliateOffer.deleteMany({ product_id: pid, source: 'tradetracker' });
        await base44.asServiceRole.entities.AffiliateOffer.bulkCreate(offers);
        offersCreated += offers.length;
        productsUpdated.add(pid);
      } catch (e) {
        errors.push({ product_id: pid, error: ((e && e.message) || String(e)) });
      }
    }

    const advertiserList = Object.entries(advertisers).map(([k, v]) => ({ campaignID: k, offers: v }));

    return Response.json({
      ok: true,
      missing: [],
      rows_read: rowsRead,
      products_updated: productsUpdated.size,
      offers_created: offersCreated,
      advertisers: advertiserList,
      errors,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: (error && error.message) || 'sync error' }, { status: 500 });
  }
}