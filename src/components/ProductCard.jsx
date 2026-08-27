import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Package } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_LABEL_KEY } from '@/lib/shop';

export default function ProductCard({ product }) {
  const { t } = useI18n();
  const slug = product.slug || product.id;
  const to = '/shop/' + encodeURIComponent(slug);
  return (
    <Link
      to={to}
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
        {product.category && (
          <p className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.18em] text-terracotta">
            {t(CATEGORY_LABEL_KEY[product.category])}
          </p>
        )}
        <p className="font-heading font-semibold text-foreground leading-snug mt-1">{product.name}</p>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{product.description}</p>
        )}
        <div className="mt-auto flex items-center gap-1 pt-3 text-sm font-medium text-primary">
          <Search className="w-4 h-4" /> {t('shop.confronta')}
        </div>
      </div>
    </Link>
  );
}