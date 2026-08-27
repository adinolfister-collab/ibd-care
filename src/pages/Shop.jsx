import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import MagazineEssay from '@/components/MagazineEssay';
import EditorialBlock from '@/components/EditorialBlock';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/ProductCard';
import { CATEGORY_LABEL_KEY } from '@/lib/shop';
import { cn } from '@/lib/utils';

export default function Shop() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Product.list('-order,-created_date', 400);
        setItems((data || []).filter((p) => p.active !== false));
      } catch { setItems([]); }
      setLoading(false);
    })();
  }, []);

  const categories = ['nutrizione', 'stomia', 'comfort', 'igiene'];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (filter !== 'all' && p.category !== filter) return false;
      if (q) {
        const blob = [p.name, p.description, p.query].filter(Boolean).join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [items, filter, search]);

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
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground leading-relaxed select-text">{t('shop.disclaimer')}</p>
      </MagazineEssay>
      <EditorialBlock sectionKey="shop_partner" align="right" />
    </AppLayout>
  );
}