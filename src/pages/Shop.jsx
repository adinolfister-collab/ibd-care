import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, ExternalLink, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import MagazineEssay from '@/components/MagazineEssay';
import EditorialBlock from '@/components/EditorialBlock';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { trackShopClick, CATEGORY_LABEL_KEY } from '@/lib/shop';
import { cn } from '@/lib/utils';

export default function Shop() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Product.list('-order,-created_date', 400);
        setItems((data || []).filter((p) => p.active !== false));
      } catch { setItems([]); }
      setLoading(false);
    })();
  }, []);

  const categories = ['integratori_nutraceutici', 'alimenti_speciali', 'presidi_medici_stomia'];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (filter !== 'all' && p.category !== filter) return false;
      if (q) {
        const blob = [p.name, p.supplier, p.description].filter(Boolean).join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [items, filter, search]);

  const openExternal = (p) => {
    trackShopClick(p, 'detail');
    window.open(p.supplier_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AppLayout>
      <PageHeader title={t('shop.title')} subtitle={t('shop.subtitle')} />
      <PageEditorial pageKey="shop" />
      <MagazineEssay theme="esami" number="01" eyebrow="Negozio" title={t('shop.title')}>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => setFilter('all')} className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-colors', filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}>
            {t('shop.category_all')}
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-colors', filter === c ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}>
              {t(CATEGORY_LABEL_KEY[c])}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('shop.search_placeholder')}
              className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ShoppingBag} title={t('shop.empty')} description={t('shop.subtitle')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setDetail} />
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground leading-relaxed select-text">{t('shop.disclaimer')}</p>
      </MagazineEssay>
      <EditorialBlock sectionKey="shop_partner" align="right" />

      {/* Detail / quick view */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40" onClick={() => setDetail(null)}>
          <div className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-xl border border-border max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-52 bg-accent">
              {detail.image_url ? (
                <img src={detail.image_url} alt={detail.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ShoppingBag className="w-12 h-12" /></div>
              )}
              <button onClick={() => setDetail(null)} className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              {detail.category && <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">{t(CATEGORY_LABEL_KEY[detail.category])}</p>}
              <h2 className="font-heading text-2xl font-semibold mt-1">{detail.name}</h2>
              {detail.supplier && <p className="text-sm text-muted-foreground">{detail.supplier}</p>}
              {detail.price_indicativo && <p className="text-lg font-semibold mt-2 text-foreground">{t('shop.price_label')} {detail.price_indicativo}</p>}
              {detail.description && <p className="text-sm text-foreground/90 mt-3 leading-relaxed whitespace-pre-wrap">{detail.description}</p>}
              <Button onClick={() => openExternal(detail)} className="w-full rounded-xl h-12 mt-5">
                <ExternalLink className="w-4 h-4 mr-1.5" /> {t('shop.go_to_product')}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">{t('shop.disclaimer')}</p>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}