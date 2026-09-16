import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Package } from 'lucide-react';
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
      className="group text-left flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="relative w-full aspect-[4/3] bg-accent overflow-hidden">
        {product.image_url ? (
          <Image src={product.image_url} fittingType="fill" alt={product.name} className="w-full h-full block transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Package className="w-10 h-10" />
          </div>
        )}
        {product.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur text-[0.6rem] font-heading font-semibold uppercase tracking-[0.18em] text-terracotta shadow-sm">
            {t(CATEGORY_LABEL_KEY[product.category])}
          </span>
        )}
      </div>
      <div className="p-4 md:p-5 flex-1 flex flex-col">
        <p className="font-heading font-semibold text-foreground leading-snug">{product.name}</p>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">{product.description}</p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-terracotta">
          <ArrowUpRight className="w-4 h-4" /> {t('shop.see_product')}
        </div>
      </div>
    </Link>
  );
}