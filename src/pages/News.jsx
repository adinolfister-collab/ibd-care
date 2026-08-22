import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, ExternalLink, RefreshCw, Loader2, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import EmptyState from '@/components/EmptyState';
import EntityFormDialog from '@/components/EntityFormDialog';
import NewsShareButtons from '@/components/NewsShareButtons';
import PageShareButtons from '@/components/PageShareButtons';
import TopRightActions from '@/components/TopRightActions';
import LanguageMenu from '@/components/LanguageMenu';
import PublicFooter from '@/components/PublicFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LANGS = [
  { code: 'it', label: '🇮🇹 IT' },
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'es', label: '🇪🇸 ES' },
  { code: 'fr', label: '🇫🇷 FR' },
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'pt', label: '🇵🇹 PT' },
];

const REFRESH_MS = 5 * 60 * 1000; // auto-aggiornamento ogni 5 minuti

const fields = () => [
  { name: 'title', label: 'Titolo', type: 'text' },
  { name: 'summary', label: 'Sommario', type: 'textarea' },
  { name: 'source', label: 'Fonte', type: 'text' },
  { name: 'url', label: 'URL', type: 'text' },
  { name: 'date', label: 'Data', type: 'date' },
  { name: 'lang', label: 'Lingua', type: 'select', options: LANGS.map((l) => ({ value: l.code, label: l.label })) },
];

// Pagina Notizie IBD pubblica: elenco con aggiornamento automatico,
// filtro per lingua e inserimento admin in tutte le 6 lingue.
export default function News() {
  const { t, lang } = useI18n();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(lang || 'it');
  const [me, setMe] = useState(null);
  const [open, setOpen] = useState(false);

  const isAdmin = me?.role === 'admin';

  const load = useCallback(async () => {
    try {
      const data = await base44.entities.NewsArticle.list('-date', 200);
      setArticles(data);
    } catch (e) {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => { try { setMe(await base44.auth.me()); } catch (e) {} })();
    load();
    const id = setInterval(load, REFRESH_MS);
    const unsub = base44.entities.NewsArticle.subscribe(() => { load(); });
    return () => { clearInterval(id); unsub(); };
  }, [load]);

  const visible = filter === 'all' ? articles : articles.filter((a) => (a.lang || 'it') === filter);
  const locale = lang === 'it' ? 'it-IT' : undefined;

  const handleCreate = async (data) => {
    setOpen(false);
    const payload = {
      ...data,
      lang: data.lang || 'it',
      date: data.date || new Date().toISOString().slice(0, 10),
    };
    try { await base44.entities.NewsArticle.create(payload); } catch (e) {}
  };

  const handleDelete = async (id) => { try { await base44.entities.NewsArticle.delete(id); } catch (e) {} };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="fixed top-3 right-3 z-40 flex items-center gap-2" style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
        <LanguageMenu />
        <TopRightActions />
      </div>

      <div className="px-4 md:px-10 py-6 md:py-10 max-w-3xl mx-auto">
        <PageHeader
          title={t('news.title')}
          subtitle={t('news.page_subtitle')}
          action={(
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button onClick={() => setOpen(true)} className="rounded-xl">
                  <Plus className="w-4 h-4 mr-1.5" />{t('news.add')}
                </Button>
              )}
              <PageShareButtons title={t('news.title')} summary={t('news.page_subtitle')} path="/news" label={t('share.page')} />
            </div>
          )}
        />
        <PageEditorial pageKey="news" />

        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={t('news.all')} />
          {LANGS.map((l) => (
            <FilterChip key={l.code} active={filter === l.code} onClick={() => setFilter(l.code)} label={l.label} />
          ))}
          <Button variant="ghost" size="icon" onClick={load} aria-label={t('news.refresh')} className="ml-auto shrink-0">
            <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
          </Button>
        </div>

        {loading && visible.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">{t('news.loading')}</span>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState icon={Newspaper} title={t('news.empty')} />
        ) : (
          <div className="space-y-3">
            {visible.map((a) => (
              <Card key={a.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/news/${a.id}`} className="group flex-1 min-w-0">
                      <h3 className="text-base font-medium leading-snug group-hover:text-primary transition-colors">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed line-clamp-3">{a.summary}</p>
                    </Link>
                    {isAdmin && (
                      <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 shrink-0" aria-label={t('news.delete')}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium"><ExternalLink className="w-3 h-3" />{a.source}</span>
                    {a.date && (
                      <>
                        <span>·</span>
                        <span>{new Date(a.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </>
                    )}
                    <span>·</span>
                    <span className="uppercase">{a.lang}</span>
                  </div>
                  <div onClick={(e) => e.preventDefault()}>
                    <NewsShareButtons title={a.title} summary={a.summary} shareUrl={`https://ibd-care.it/news/${a.id}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <EditorialBlock sectionKey="article_share" align="right" />

        <EntityFormDialog
          open={open}
          onOpenChange={setOpen}
          title={t('news.add')}
          submitLabel={t('common.save')}
          fields={fields()}
          initialData={{ lang: lang || 'it', date: new Date().toISOString().slice(0, 10) }}
          onSubmit={handleCreate}
        />
      </div>

      <PublicFooter />
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
      )}
    >
      {label}
    </button>
  );
}