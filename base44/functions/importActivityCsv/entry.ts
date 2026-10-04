import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Import di un file CSV di attivita' (export di Samsung Health, Apple Health,
// Google Fit o app simili). Il file viene caricato privatamente (UploadPrivateFile
// -> file_uri); qui creiamo uno signed URL a breve scadenza, leggiamo il testo
// e lo parsiamo senza esporre pubblicamente il contenuto.
// Riconosce colonne comuni per data, passi, kcal e distanza e restituisce righe
// normalizzate per la revisione utente. Nessun record viene scritto qui: il
// salvataggio avviene lato frontend dopo conferma.

function parseCsv(text) {
  const lines = text.replace(/\uFEFF/g, '').split(/\r\n|\n|\r/).filter((l) => l.length);
  if (!lines.length) return [];
  const split = (line) => {
    const out = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; }
        else { q = !q; }
      } else if (c === ',' && !q) {
        out.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim().replace(/^"|"$/g, ''));
  };
  const header = split(lines[0]).map((h) => h.toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = split(lines[i]);
    if (cells.length === 1 && !cells[0]) continue;
    const obj = {};
    header.forEach((h, idx) => { obj[h] = cells[idx] || ''; });
    rows.push(obj);
  }
  return rows;
}

function findKey(obj, candidates) {
  const keys = Object.keys(obj);
  for (const c of candidates) {
    const k = keys.find((kk) => kk.includes(c));
    if (k) return k;
  }
  return null;
}

function parseDate(s) {
  if (!s) return null;
  const t = String(s).trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  m = t.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

function num(v) {
  if (v == null || v === '') return 0;
  const n = parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
  return isFinite(n) && n > 0 ? n : 0;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fileUri = body && body.file_uri;
    if (!fileUri || typeof fileUri !== 'string' || fileUri.length > 2048) {
      return Response.json({ error: 'file_uri mancante' }, { status: 400 });
    }

    const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: 120 });
    const url = signed && signed.signed_url;
    if (!url) return Response.json({ error: 'Impossibile leggere il file' }, { status: 500 });

    const resp = await fetch(url);
    if (!resp.ok) return Response.json({ error: 'Lettura CSV fallita' }, { status: 500 });
    const text = await resp.text();
    const raw = parseCsv(text);
    if (!raw.length) return Response.json({ error: 'CSV vuoto o non riconosciuto' }, { status: 400 });

    const dk = findKey(raw[0], ['date', 'data', 'giorno', 'day']);
    const sk = findKey(raw[0], ['step', 'passi']);
    const kk = findKey(raw[0], ['kcal', 'cal', 'calorie', 'energy', 'energia']);
    const dtk = findKey(raw[0], ['distan', 'distance', 'km', 'metr']);

    const rows = [];
    for (const r of raw) {
      const entry_date = dk ? parseDate(r[dk]) : parseDate(r[Object.keys(r)[0]]);
      if (!entry_date) continue;
      rows.push({
        entry_date,
        steps: Math.round(num(sk ? r[sk] : 0)),
        kcal_expended: Math.round(num(kk ? r[kk] : 0)),
        distance_m: Math.round(num(dtk ? r[dtk] : 0) * (dtk && (r[findKey(raw[0], ['km'])] != null) ? 1000 : 1))
      });
    }
    if (!rows.length) return Response.json({ error: 'Nessuna riga valida (manca la colonna data?)' }, { status: 400 });
    return Response.json({ rows });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}