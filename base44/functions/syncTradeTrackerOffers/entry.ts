import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { norm, toNumber, fetchWithTimeout, parseCsv, colIndex, matchProduct } from '../../shared/affiliateFeed.ts';
import { secrets } from 'base44:runtime';

// Sincronizzazione offerte affiliate dal network TradeTracker.
// Scarica un product feed CSV unificato (secret TRADTRACKER_FEED_URL) e
// lo parsa IN STREAMING riga per riga (Reader del body + TextDecoder) per
// non caricare mai l'intero file in memoria (i feed unificati sono grandi).
// Delimitatore auto-detect (il feed TradeTracker usa ';').
// Match di ogni riga ai Product del catalogo via GTIN/EAN -> Product.query
// oppure nome normalizzato; upsert AffiliateOffer con source='tradetracker'.
// Lo store_name e' derivato dall'host del productURL (es. 'eurofarmacia.it').
// Admin-only; invocabile anche dal workflow schedulato (pull: limit).

// Sceglie il delimitatore contando ';' vs ',' sulla prima riga.
function detectDelimiter(line) {
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

// Legge dal body stream finche' non trova la prima riga completa (tenendo
// conto delle virgolette per a capo annidati) e la restituisce. Restituisce
// anche il reader gia' avanzato per continuare a consumare il resto.
async function readHeaderLine(reader) {
  const dec = new TextDecoder('utf-8');
  let pending = '';
  let q = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += dec.decode(value, { stream: true });
    for (let i = 0; i < pending.length; i++) {
      const c = pending[i];
      if (q) {
        if (c === '"') q = false;
      } else if (c === '"') {
        q = true;
      } else if (c === '\n') {
        const line = pending.slice(0, i);
        reader.pendingRemainder = pending.slice(i + 1);
        return line;
      }
    }
  }
  const last = dec.decode();
  if (last) pending += last;
  reader.pendingRemainder = '';
  return pending;
}

// Streaming quote-aware: emette ogni riga completa via onRow(row).
function feedChunk(text, delimiter, q, field, row, onRow) {
  let qq = q, fld = field, rw = row;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (qq) {
      if (c === '"') {
        if (text[i + 1] === '"') { fld += '"'; i++; }
        else qq = false;
      } else fld += c;
    } else {
      if (c === '"') qq = true;
      else if (c === delimiter) { rw.push(fld); fld = ''; }
      else if (c === '\n') { rw.push(fld); onRow(rw); rw = []; fld = ''; }
      else if (c === '\r') { /* ignore */ }
      else fld += c;
    }
  }
  return { qOut: qq, fieldOut: fld, rowOut: rw };
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

    // 2) Apri lo stream del feed (headers entro 30s, poi parsing in streaming)
    let res;
    try {
      res = await fetchWithTimeout(feedUrl, {}, 30000);
    } catch (e) {
      return Response.json({ ok: false, missing: [], error: 'feed_unreachable: ' + ((e && e.message) || String(e)) }, { status: 502 });
    }
    if (!res.ok) {
      return Response.json({ ok: false, missing: [], error: 'feed_http_' + res.status }, { status: 502 });
    }
    if (!res.body || !res.body.getReader) {
      // Fallback: body non streamabile (raro) — usa text()
      const txt = await res.text();
      return Response.json({ ok: false, missing: [], message: 'Body non streamabile. Lite fallback non disponibile su feed grandi.' }, { status: 502 });
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder('utf-8');

    // 2a) Header: prima riga completa
    const headerLine = await readHeaderLine(reader);
    if (!headerLine) {
      return Response.json({ ok: false, missing: [], message: 'Feed vuoto o intestazione non leggibile.' });
    }
    const delimiter = detectDelimiter(headerLine);
    const h = parseCsv(headerLine + '\n', delimiter, 1)[0] || [];
    const iName = colIndex(h, ['name', 'product_name', 'title']);
    const iPrice = colIndex(h, ['price', 'search_price', 'store_price']);
    const iUrl = colIndex(h, ['productURL', 'product_url', 'url', 'aw_deep_link', 'deeplink']);
    const iImg = colIndex(h, ['imageURL', 'image_url', 'aw_image_url', 'merchant_image_url']);
    const iGtin = colIndex(h, ['GTIN', 'gtin', 'EAN', 'ean']);
    const iCampaign = colIndex(h, ['campaignID', 'campaign_id', 'campaign']);

    // 3) Parsing in streaming riga per riga; initializzo accumulo offerte per prodotto
    const freshByProduct = {};
    const advertisers = {}; // chiave campaignID (o store) -> count offerte
    let rowsRead = 0;
    const productsUpdated = new Set();

    const processRow = (row) => {
      rowsRead++;
      if (!row) return;
      const url = row[iUrl];
      if (!url) return;
      const price = toNumber(row[iPrice]);
      if (price === undefined) return;
      const store = hostFromUrl(url);
      if (!store) return;
      const rawEan = (row[iGtin] || '').toString().replace(/\s+/g, '');
      const ean = /^\d{6,}$/.test(rawEan) ? rawEan : '';
      const pname = row[iName] || '';
      const matched = matchProduct(ean, norm(pname), eanMap, nameMap, products);
      if (!matched.length) return;
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
    };

    let q = false, fld = '', rw = [];
    let stopped = false;
    // Consuma il rimanzo della lettura header come primo "chunk"
    if (reader.pendingRemainder) {
      const state = feedChunk(reader.pendingRemainder, delimiter, q, fld, rw, (r) => {
        if (!stopped) processRow(r);
        if (rowLimit && rowsRead >= rowLimit) stopped = true;
      });
      q = state.qOut; fld = state.fieldOut; rw = state.rowOut;
      reader.pendingRemainder = null;
    }
    while (!stopped) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = dec.decode(value, { stream: true });
      const state = feedChunk(text, delimiter, q, fld, rw, (r) => {
        if (!stopped) processRow(r);
        if (rowLimit && rowsRead >= rowLimit) stopped = true;
      });
      q = state.qOut; fld = state.fieldOut; rw = state.rowOut;
    }
    // Flush finale (decoder svuotato)
    const tail = dec.decode();
    if (tail && !stopped) {
      feedChunk(tail, delimiter, q, fld, rw, (r) => {
        if (!stopped) processRow(r);
        if (rowLimit && rowsRead >= rowLimit) stopped = true;
      });
    } else if ((fld.length || rw.length) && !stopped) {
      rw.push(fld); processRow(rw);
    }
    try { reader.releaseLock(); } catch {}

    // 4) Persisti: per ogni prodotto toccato, azzera le offerte TradeTracker e ricrea
    let offersCreated = 0;
    const errors = [];
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