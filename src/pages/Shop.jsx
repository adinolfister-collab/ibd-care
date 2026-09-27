import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import MagazineEssay from '@/components/MagazineEssay';
import EditorialBlock from '@/components/EditorialBlock';
import EmptyState from '@/components/EmptyState';
import ProductCard from '@/components/ProductCard';
import ShopStandby from '@/components/ShopStandby';
import { CATEGORY_LABEL_KEY } from '@/lib/shop';
import { cn } from '@/lib/utils';

const CATEGORY_ORDER = ['nutrizione', 'stomia', 'comfort', 'igiene', 'farmaci', 'integratori', 'dispositivi', 'cura_persona', 'alimentazione_speciale'];

const pad = (n) => (n < 10 ? '0' + n : '' + n);

export default function Shop() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Product.list('order', 400);
        setItems((data || []).filter((p) => p.active !== false));
      } catch { setItems([]); }
      setLoading(false);
    })();
  }, []);

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

  const shelves = useMemo(() => {
    const groups = {};
    for (const p of filtered) {
      const c = CATEGORY_ORDER.includes(p.category) ? p.category : 'altri';
      (groups[c] = groups[c] || []).push(p);
    }
    const ordered = CATEGORY_ORDER.filter((c) => groups[c] && groups[c].length);
    if (groups.altri && groups.altri.length) ordered.push('altri');
    return ordered.map((c, i) => ({ key: c, num: pad(i + 1), products: groups[c] }));
  }, [filtered]);

  // Shop in standby for non-admins while advertising channels are being defined.
  if (user?.role !== 'admin') return <ShopStandby />;

  return (
    <AppLayout>
      <PageHeader title={t('shop.title')} subtitle={t('shop.subtitle')} />
      <PageEditorial pageKey="shop" />

      <MagazineEssay theme="esami" number="01" eyebrow={t('shop.eyebrow')} title={t('shop.title')}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => setFilter('all')} className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-colors', filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-accent/70')}>
            {t('shop.category_all')}
          </button>
          {CATEGORY_ORDER.map((c) => (
            <button key={c} onClick={() => setFilter(c)} className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-colors', filter === c ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-accent/70')}>
              {t(CATEGORY_LABEL_KEY[c])}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('shop.search_placeholder')}
              className="w-full rounded-full border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </MagazineEssay>

      {loading ? (
        <div className="py-20 flex items-center justify-center text-muted-foreground"><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('common.loading')}</div>
      ) : shelves.length === 0 ? (
        <EmptyState icon={ShoppingBag} title={t('shop.empty')} description={t('shop.subtitle')} />
      ) : (
        <div className="space-y-10 md:space-y-12">
          {shelves.map((shelf) => (
            <section key={shelf.key} className="rounded-3xl bg-accent/40 border border-border p-5 md:p-7 shadow-sm">
              <div className="flex items-baseline gap-3 mb-5">
                <span className="font-display text-3xl md:text-4xl font-semibold text-terracotta leading-none">{shelf.num}</span>
                <h3 className="font-heading text-xl md:text-2xl font-semibold text-primary tracking-tight leading-none">
                  {shelf.key === 'altri' ? t('shop.category_all') : t(CATEGORY_LABEL_KEY[shelf.key])}
                </h3>
                <span className="text-sm text-muted-foreground ml-1">· {shelf.products.length} {t('shop.shelf_products')}</span>
                <div className="ml-auto h-px flex-1 bg-border/70 hidden sm:block" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {shelf.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground leading-relaxed select-text">{t('shop.disclaimer')}</p>
      <EditorialBlock sectionKey="shop_partner" align="right" />
    </AppLayout>
  );
}