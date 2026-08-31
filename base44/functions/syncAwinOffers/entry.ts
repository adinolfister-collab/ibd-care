import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { norm, toNumber, fetchWithTimeout, parseCsv, colIndex, matchProduct } from '../../shared/affiliateFeed.ts';
import { secrets } from 'base44:runtime';

// Sincronizzazione offerte affiliate dal network Awin.
// Approccio ibrido: scarica i product feed CSV degli advertiser "joined" e
// upserta AffiliateOffer per i Product del catalogo che matchano (EAN o nome).
// Richiede: AWIN_API_TOKEN + AWIN_PUBLISHER_ID (validazione programmi) e
// AWIN_DATAFEED_API_KEY (download feed, chiave diversa dal token Publisher).
// Se la chiave datafeed manca, restituisce comunque l'elenco programmi joined
// e segnala la secret mancante, senza crashare (la UI mostra cosa manca).
// Admin-only; invocabile anche dal workflow schedulato (pull: limit).

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const advertiserLimit = Math.min(Math.max(parseInt(body.limit, 10) || 18, 1), 40);
    const rowLimit = Math.min(Math.max(parseInt(body.row_limit, 10) || 12000, 100), 60000);

    const token = secrets.get('AWIN_API_TOKEN');
    const publisherId = secrets.get('AWIN_PUBLISHER_ID');
    const datafeedKey = secrets.get('AWIN_DATAFEED_API_KEY');
    const missing = [];
    if (!token) missing.push('AWIN_API_TOKEN');
    if (!publisherId) missing.push('AWIN_PUBLISHER_ID');
    if (!datafeedKey) missing.push('AWIN_DATAFEED_API_KEY');

    // 1) Programmi joined (validazione token publisher)
    let programmes = [];
    let programmesError = null;
    if (token && publisherId) {
      try {
        const r = await fetchWithTimeout(
          `https://api.awin.com/publishers/${encodeURIComponent(publisherId)}/programmes?relationship=joined`,
          { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } },
          15000
        );
        if (r.ok) programmes = await r.json();
        else programmesError = 'HTTP ' + r.status;
      } catch (e) { programmesError = (e && e.message) || String(e); }
    }
    if (!Array.isArray(programmes)) programmes = [];

    const programmeSummary = programmes.map((p) => ({
      id: p.id,
      name: p.name,
      region: p.primaryRegion && p.primaryRegion.name,
      status: p.status,
    }));

    // Configurazione incompleta: restituisci programmi (se disponibili) + secret mancanti
    if (missing.length || programmesError) {
      return Response.json({
        ok: false,
        missing,
        programmes: programmeSummary,
        programmes_error: programmesError,
        message: missing.includes('AWIN_DATAFEED_API_KEY')
          ? 'Token publisher valido. Imposta anche AWIN_DATAFEED_API_KEY per scaricare i product feed degli advertiser.'
          : 'Configurazione Awin incompleta.',
        synced_at: new Date().toISOString(),
      });
    }

    // 2) Carica il catalogo Product
    const products = await base44.asServiceRole.entities.Product.list('-updated_date', 1000) || [];
    const eanMap = {};
    const nameMap = {};
    for (const p of products) {
      if (p.query && /^\d{6,}$/.test(String(p.query).trim())) {
        const k = String(p.query).trim();
        if (!eanMap[k]) eanMap[k] = p;
      }
      if (p.name) {
        const k = norm(p.name);
        if (k && !nameMap[k]) nameMap[k] = p;
      }
    }

    // 3) Scarica la lista feed (CSV con URL di download per advertiser)
    let flRes;
    try {
      flRes = await fetchWithTimeout(
        `https://productdata.awin.com/datafeed/list/apikey/${encodeURIComponent(datafeedKey)}`,
        {},
        20000
      );
    } catch (e) {
      return Response.json({ ok: false, missing: [], programmes: programmeSummary, error: 'feed_list_unreachable: ' + ((e && e.message) || String(e)) }, { status: 502 });
    }
    if (!flRes.ok) {
      return Response.json({ ok: false, missing: [], programmes: programmeSummary, error: 'feed_list_http_' + flRes.status }, { status: 502 });
    }
    const flRows = parseCsv(await flRes.text(), ',');
    if (flRows.length < 2) {
      return Response.json({ ok: false, missing: [], programmes: programmeSummary, message: 'Feed list vuota o non leggibile.' });
    }
    const h = flRows[0];
    const idxAdv = colIndex(h, ['Advertiser ID', 'advertiserId']);
    const idxStatus = colIndex(h, ['Membership Status', 'membershipStatus']);
    const idxUrl = colIndex(h, ['URL', 'url']);
    const idxAdvName = colIndex(h, ['Advertiser Name', 'advertiserName']);
    const feedByAdv = {};
    for (let i = 1; i < flRows.length; i++) {
      const r = flRows[i];
      if (!r || !r.length) continue;
      const adv = r[idxAdv];
      if (!adv) continue;
      const status = (r[idxStatus] || '').toString();
      if (status && status.toLowerCase().includes('not joined')) continue;
      let url = r[idxUrl];
      if (!url) continue;
      if (url.indexOf('compression/gzip') !== -1) url = url.replace('compression/gzip', 'compression/none');
      feedByAdv[String(adv)] = { url, name: r[idxAdvName] };
    }

    // 4) Per ogni programma joined con feed disponibile: scarica, matcha, persisti
    const syncedAdvertisers = [];
    const errors = [];
    let offersCreated = 0;
    const productsUpdated = new Set();
    let counter = 0;

    for (const p of programmes.slice(0, advertiserLimit)) {
      const feed = feedByAdv[String(p.id)];
      if (!feed) continue;
      if (counter > 0) await sleep(4000); // rispetto throttle ~15 chiamate/min
      counter++;
      try {
        const r = await fetchWithTimeout(feed.url, {}, 30000);
        if (!r.ok) { errors.push({ advertiser: p.id, name: p.name, error: 'http_' + r.status }); continue; }
        const rows = parseCsv(await r.text(), ',', rowLimit);
        if (rows.length < 2) { syncedAdvertisers.push({ id: p.id, name: p.name, offers: 0 }); continue; }
        const hd = rows[0];
        const iDeep = colIndex(hd, ['aw_deep_link', 'deeplink', 'deep_link']);
        const iName = colIndex(hd, ['product_name', 'name']);
        const iSearch = colIndex(hd, ['search_price', 'store_price', 'price']);
        const iStore = colIndex(hd, ['merchant_name', 'advertiser_name']);
        const iImg = colIndex(hd, ['aw_image_url', 'merchant_image_url', 'image_url']);
        const iEan = colIndex(hd, ['ean']);

        const freshByProduct = {};
        for (let i = 1; i < rows.length && i <= rowLimit; i++) {
          const row = rows[i];
          if (!row) continue;
          const deep = row[iDeep];
          if (!deep) continue;
          const price = toNumber(row[iSearch]);
          if (price === undefined) continue;
          const store = row[iStore];
          if (!store) continue;
          const ean = (row[iEan] || '').toString().trim();
          const pname = row[iName] || '';
          const matched = matchProduct(ean, norm(pname), eanMap, nameMap, products);
          if (!matched.length) continue;
          for (const prod of matched) {
            if (!freshByProduct[prod.id]) freshByProduct[prod.id] = {};
            const key = deep;
            if (freshByProduct[prod.id][key]) continue;
            freshByProduct[prod.id][key] = {
              product_id: prod.id,
              store_name: String(store),
              store_price: price,
              affiliate_url: deep,
              image_url: row[iImg] || undefined,
              title: pname || undefined,
              source: 'awin',
            };
          }
        }

        let advOffers = 0;
        for (const pid in freshByProduct) {
          const offers = Object.values(freshByProduct[pid]);
          try {
            await base44.asServiceRole.entities.AffiliateOffer.deleteMany({ product_id: pid, source: 'awin' });
            await base44.asServiceRole.entities.AffiliateOffer.bulkCreate(offers);
            advOffers += offers.length;
            offersCreated += offers.length;
            productsUpdated.add(pid);
          } catch (e) {
            errors.push({ advertiser: p.id, error: 'persist: ' + ((e && e.message) || String(e)) });
          }
        }
        syncedAdvertisers.push({ id: p.id, name: p.name, offers: advOffers });
      } catch (e) {
        errors.push({ advertiser: p.id, error: (e && e.message) || String(e) });
      }
    }

    return Response.json({
      ok: true,
      missing: [],
      programmes: programmeSummary,
      advertisers_synced: syncedAdvertisers.length,
      advertisers: syncedAdvertisers,
      offers_created: offersCreated,
      products_updated: productsUpdated.size,
      errors,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: (error && error.message) || 'sync error' }, { status: 500 });
  }
}