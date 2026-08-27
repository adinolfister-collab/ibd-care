import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Package, ShoppingBag, Tag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import EditorialBlock from '@/components/EditorialBlock';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import { CATEGORY_LABEL_KEY, formatPrice, trackShopClick } from '@/lib/shop';
import { cn } from '@/lib/utils';

export default function ProductDetail() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingProduct(true);
      try {
        let p;
        try {
          const list = await base44.entities.Product.filter({ slug }, '-created_date', 5);
          p = (list && list[0]) || null;
        } catch { p = null; }
        if (!p) {
          try { p = await base44.entities.Product.get(slug); } catch { p = null; }
        }
        if (!p) setNotFound(true);
        else setProduct(p);
      } catch { setNotFound(true); }
      setLoadingProduct(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    (async () => {
      setLoadingOffers(true);
      try {
        // 1) Offerte reali salvate nel DB (comparatore statico)
        let stored = [];
        try {
          stored = await base44.entities.AffiliateOffer.filter({ product_id: product.id }, 'store_price', 50);
        } catch { stored = []; }
        if (cancelled) return;
        if (stored && stored.length) {
          const sorted = [...stored].sort((a, b) => a.store_price - b.store_price);
          setOffers(sorted);
          setConfigured(true);
          setLoadingOffers(false);
          return;
        }
        // 2) Fallback: lookup live del network affiliate (se configurato)
        const query = (product.query || product.name || '').trim();
        if (!query) { setOffers([]); setLoadingOffers(false); return; }
        const res = await base44.functions.invoke('lookupAffiliateOffers', { query, limit: 25 });
        if (cancelled) return;
        setOffers(res?.data?.offers || []);
        setConfigured(res?.data?.configured !== false);
      } catch {
        if (!cancelled) setOffers([]);
      }
      if (!cancelled) setLoadingOffers(false);
    })();
    return () => { cancelled = true; };
  }, [product]);

  if (loadingProduct) {
    return (
      <AppLayout>
        <div className="py-24 flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('common.loading')}</div>
      </AppLayout>
    );
  }
  if (notFound || !product) {
    return (
      <AppLayout>
        <EmptyState icon={ShoppingBag} title={t('shop.not_found')} description="" />
        <div className="mt-4"><Link to="/shop" className="text-primary underline">{t('shop.back_to_shop')}</Link></div>
      </AppLayout>
    );
  }

  const best = offers[0];
  const openOffer = (offer) => {
    trackShopClick(offer, product, 'offer');
    window.open(offer.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AppLayout>
      <PageHeader title={product.name} subtitle={product.category ? t(CATEGORY_LABEL_KEY[product.category]) : ''} />
      <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> {t('shop.back_to_shop')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <div className="rounded-2xl border border-border bg-accent overflow-hidden">
          <div className="w-full h-64 md:h-80">
            {product.image_url ? (
              <Image src={product.image_url} fittingType="fill" alt={product.name} className="w-full h-full block" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-14 h-14" /></div>
            )}
          </div>
        </div>

        <div>
          <p className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.22em] text-terracotta">
            {product.category ? t(CATEGORY_LABEL_KEY[product.category]) : ''}
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold mt-1 leading-tight">{product.name}</h1>
          {product.description && (
            <p className="text-sm md:text-base text-foreground/90 mt-3 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          )}

          <div className="mt-5">
            <p className="text-xs font-heading font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
              {t('shop.offers_label')}
            </p>
            {loadingOffers ? (
              <div className="flex items-center gap-2 text-muted-foreground py-6"><Loader2 className="w-4 h-4 animate-spin" /> {t('shop.loading_offers')}</div>
            ) : !configured ? (
              <EmptyState icon={Tag} title={t('shop.api_not_configured')} description={t('shop.disclaimer')} />
            ) : offers.length === 0 ? (
              <EmptyState icon={Tag} title={t('shop.no_offers')} description={t('shop.disclaimer')} />
            ) : (
              <div className="space-y-2.5">
                {offers.map((o, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border bg-card p-3',
                      i === 0 ? 'border-terracotta shadow-sm' : 'border-border'
                    )}
                  >
                    <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center shrink-0 overflow-hidden">
                      {o.image_url ? (
                        <img src={o.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Tag className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{o.store_name}</p>
                      {o.title && <p className="text-xs text-muted-foreground truncate">{o.title}</p>}
                      <p className={cn('font-heading font-semibold mt-0.5', i === 0 ? 'text-terracotta text-xl' : 'text-foreground text-lg')}>
                        {formatPrice(o.store_price, lang)}
                      </p>
                    </div>
                    <Button
                      onClick={() => openOffer(o)}
                      variant={i === 0 ? 'default' : 'outline'}
                      className="rounded-xl shrink-0"
                    >
                      {i === 0 ? (<><Tag className="w-4 h-4 mr-1" /> {t('shop.acquista_migliore')}</>) : (<>{t('shop.see_offer')} <ExternalLink className="w-3.5 h-3.5 ml-1" /></>)}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground leading-relaxed select-text">{t('shop.disclaimer')}</p>
      <EditorialBlock sectionKey="shop_partner" align="right" />
    </AppLayout>
  );
}