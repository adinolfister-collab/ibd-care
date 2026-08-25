import { base44 } from '@/api/base44Client';

// Track an affiliate/store click as a ConversionEvent. Best-effort, non-blocking.
export function trackShopClick(product, source = 'catalog') {
  const payload = {
    event_name: 'shop_product_click',
    feature: 'shop',
    source: source + ':' + (product?.slug || product?.id || product?.name || 'unknown'),
  };
  Promise.resolve(base44.entities.ConversionEvent.create(payload)).catch(() => {});
}

export const CATEGORY_LABEL_KEY = {
  integratori_nutraceutici: 'shop.cat_integratori_nutraceutici',
  alimenti_speciali: 'shop.cat_alimenti_speciali',
  presidi_medici_stomia: 'shop.cat_presidi_medici_stomia',
};