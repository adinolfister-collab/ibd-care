import { base44 } from '@/api/base44Client';

// Registra un click su un'offerta/offerta come ConversionEvent (best-effort, non bloccante).
export function trackShopClick(offer, product, source = 'offer') {
  const payload = {
    event_name: 'shop_product_click',
    feature: 'shop',
    source: source + ':' + (offer?.store_name || 'unknown') + ':' + (product?.slug || product?.id || 'unknown'),
  };
  Promise.resolve(base44.entities.ConversionEvent.create(payload)).catch(() => {});
}

export const CATEGORY_LABEL_KEY = {
  nutrizione: 'shop.cat_nutrizione',
  stomia: 'shop.cat_stomia',
  comfort: 'shop.cat_comfort',
  igiene: 'shop.cat_igiene',
};

// --- Amazon Associates ----------------------------------------------------
// Tag affiliato Italy (Amazon Associates) usato come fallback quando la secret
// AMAZON_PARTNER_TAG non e' ancora configurata. L'admin lo conferma nel panel.
export const AMAZON_PARTNER_TAG = '200169-21';
export const AMAZON_STORE = 'Amazon';
export const AMAZON_HOME_URL = `https://www.amazon.it/?tag=${AMAZON_PARTNER_TAG}`;

// Estrae l'ASIN (10 caratteri alfanumerici, di solito inizia con B0) da un URL
// Amazon nei formati piu' comuni (/dp/, /gp/product/, /gp/aw/d/, /exec/).
export function extractAmazonAsin(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (/^[A-Z0-9]{10}$/.test(s)) return s; // gia' un ASIN
  const m = s.match(/\/(?:dp|gp\/product|gp\/aw\/d|exec\/obidos\/ASIN)\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : '';
}

// Verifica se un URL punta a amazon.it
export function isAmazonUrl(url) {
  const s = String(url || '').toLowerCase();
  return /^https?:\/\/([a-z0-9-]+\.)*amazon\.it(\/|$)/.test(s);
}

// Ricostruisce l'URL canonico Amazon con il tag affiliato iniettato.
// Ignora eventuali tag/parametri gia' presenti e ricostruisce pulito.
export function buildAmazonAffiliateUrl(url, tag = AMAZON_PARTNER_TAG) {
  const asin = extractAmazonAsin(url);
  if (asin) {
    return `https://www.amazon.it/dp/${asin}?tag=${encodeURIComponent(tag)}&linkCode=ll1&language=it_IT`;
  }
  // URL generico (es. homepage o categoria): inietta solo il tag come query
  if (!isAmazonUrl(url)) return '';
  const u = new URL(url);
  u.searchParams.set('tag', tag);
  u.searchParams.set('linkCode', 'll1');
  return u.toString();
}

const LOCALE_BY_LANG = {
  it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
  pt: 'pt-PT', ru: 'ru-RU', pl: 'pl-PL', ro: 'ro-RO', sq: 'sq-AL', zh: 'zh-CN',
};

// Formatta un prezzo numerico nella valuta locale (torna stringa compatta).
export function formatPrice(value, lang) {
  const n = Number(value);
  if (!isFinite(n)) return String(value ?? '');
  const locale = LOCALE_BY_LANG[lang] || 'it-IT';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
  } catch {
    return '\u20AC ' + n.toFixed(2);
  }
}