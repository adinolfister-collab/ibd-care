import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Package, ShoppingBag, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import EditorialBlock from '@/components/EditorialBlock';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
import {
  CATEGORY_LABEL_KEY, trackShopClick, buildAmazonAffiliateUrl,
  AMAZON_PARTNER_TAG, extractAmazonAsin, isAmazonUrl,
} from '@/lib/shop';

// Costruisce il deep link affiliato Amazon per il prodotto.
// Priorita': amazon_url (ASIN o URL) > query (ASIN/URL/keyword) > vuoto.
function buildAmazonLink(product) {
  const raw = String(product?.amazon_url || product?.query || '').trim();
  if (!raw) return '';
  if (/^[A-Z0-9]{10}$/.test(raw)) return buildAmazonAffiliateUrl(raw, AMAZON_PARTNER_TAG);
  if (isAmazonUrl(raw) || extractAmazonAsin(raw)) return buildAmazonAffiliateUrl(raw, AMAZON_PARTNER_TAG);
  // Fallback keyword search su amazon.it con tag affiliato
  try {
    const u = new URL('https://www.amazon.it/s');
    u.searchParams.set('k', raw);
    u.searchParams.set('tag', AMAZON_PARTNER_TAG);
    u.searchParams.set('linkCode', 'll1');
    return u.toString();
  } catch { return ''; }
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { t } = useI18n();
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
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
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
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

  const amazonUrl = buildAmazonLink(product);

  const openAmazon = () => {
    if (!amazonUrl) return;
    trackShopClick({ store_name: 'Amazon', affiliate_url: amazonUrl }, product, 'amazon');
    window.open(amazonUrl, '_blank', 'noopener,noreferrer');
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

        <div className="flex flex-col">
          <p className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.22em] text-terracotta">
            {product.category ? t(CATEGORY_LABEL_KEY[product.category]) : ''}
          </p>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold mt-1 leading-tight">{product.name}</h1>
          {product.description && (
            <p className="text-sm md:text-base text-foreground/90 mt-3 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          )}

          <div className="mt-auto pt-6">
            {amazonUrl ? (
              <Button onClick={openAmazon} size="lg" className="rounded-xl w-full sm:w-auto">
                <ExternalLink className="w-4 h-4 mr-1.5" /> {t('shop.buy_on_amazon')}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">{t('shop.no_amazon_link')}</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed select-text">{t('shop.amazon_disclaimer')}</p>
          </div>
        </div>
      </div>

      <EditorialBlock sectionKey="shop_partner" align="right" />
    </AppLayout>
  );
}