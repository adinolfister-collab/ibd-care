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