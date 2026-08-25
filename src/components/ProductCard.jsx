import React from 'react';
import { ExternalLink, Package } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/lib/i18n';
import { trackShopClick } from '@/lib/shop';
import { cn } from '@/lib/utils';

export default function ProductCard({ product, onOpen }) {
  const { t } = useI18n();
  const go = (e) => {
    e?.stopPropagation?.();
    trackShopClick(product, 'card');
    if (onOpen) onOpen(product);
    else window.open(product.supplier_url, '_blank', 'noopener,noreferrer');
  };
  return (
    <button
      type="button"
      onClick={go}
      className="group text-left flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative w-full h-40 bg-accent">
        {product.image_url ? (
          <Image src={product.image_url} fittingType="fill" alt={product.name} className="w-full h-full block" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Package className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="font-heading font-semibold text-foreground leading-snug">{product.name}</p>
        {product.supplier && <p className="text-xs text-muted-foreground mt-0.5">{product.supplier}</p>}
        {product.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className={cn('text-sm font-medium', product.price_indicativo ? 'text-foreground' : 'text-muted-foreground')}>
            {product.price_indicativo ? t('shop.price_label') + ' ' + product.price_indicativo : t('shop.see_product')}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            {t('shop.go_to_product')} <ExternalLink className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}