// Helper condivisi per le funzioni di sync dei feed affiliate (Awin, TradeTracker, ...).
// Modulo plain: esporta funzioni pure, niente Deno.serve. Importato dalle entry.ts
// delle singole backend functions tramite `import { ... } from '../../shared/affiliateFeed.ts'`.

export function norm(s) { return String(s || '').toLowerCase().trim(); }

export function toNumber(v) {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v !== 'string') return undefined;
  let s = v.replace(/[^\d.,-]/g, ' ').trim();
  if (!s) return undefined;
  const hasComma = s.indexOf(',') !== -1;
  const hasDot = s.indexOf('.') !== -1;
  if (hasComma && hasDot) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hasComma) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) return undefined;
  const n = parseFloat(m[0]);
  return isFinite(n) ? n : undefined;
}

export function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

// Parser CSV minimale: gestisce virgolette, virgole e a capo annidati.
// Delimitatore parametrico (Awin usa ',', TradeTracker usa ';').
export function parseCsv(text, delimiter, maxRows) {
  const rows = [];
  let row = [];
  let field = '';
  let q = false;
  const cap = maxRows ? maxRows + 1 : Infinity; // +1 per header
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else q = false;
      } else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === delimiter) { row.push(field); field = ''; }
      else if (c === '\n') {
        row.push(field); rows.push(row); row = []; field = '';
        if (rows.length >= cap) break;
      }
      else if (c === '\r') { /* ignore */ }
      else field += c;
    }
  }
  if (rows.length < cap && (field.length || row.length)) { row.push(field); rows.push(row); }
  return rows;
}

export function colIndex(headers, names) {
  for (const n of names) {
    const i = headers.findIndex((h) => norm(h) === norm(n));
    if (i !== -1) return i;
  }
  return -1;
}

// Match di una riga feed ai Product del catalogo: prima per EAN/GTIN -> Product.query
// (codice numerico), poi per nome exact normalizzato, infine substring (max 3 match).
export function matchProduct(ean, pnameNorm, eanMap, nameMap, products) {
  const out = [];
  if (ean && /^\d{6,}$/.test(ean) && eanMap[ean] && !out.includes(eanMap[ean])) out.push(eanMap[ean]);
  if (pnameNorm && nameMap[pnameNorm] && !out.includes(nameMap[pnameNorm])) out.push(nameMap[pnameNorm]);
  if (out.length) return out;
  if (pnameNorm && pnameNorm.length >= 5) {
    const seen = new Set(out.map((p) => p.id));
    for (const p of products) {
      if (!p.name) continue;
      const pn = norm(p.name);
      if (pn.length >= 5 && (pnameNorm.includes(pn) || pn.includes(pnameNorm))) {
        if (!seen.has(p.id)) { seen.add(p.id); out.push(p); }
        if (out.length >= 3) break;
      }
    }
  }
  return out;
}