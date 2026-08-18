import React, { useState, useEffect, useCallback } from 'react';
import { Newspaper, ExternalLink, RefreshCw, ChevronRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NewsShareButtons from '@/components/NewsShareButtons';

const REFRESH_MS = 30 * 60 * 1000; // 30 minuti

export default function NewsIBD() {
  const { t, lang } = useI18n();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNews = useCallback(async (manual = false) => {
    if (manual) setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('fetchIBDNews', { lang });
      setArticles(res.data?.articles || []);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadNews();
    const id = setInterval(() => loadNews(), REFRESH_MS);
    return () => clearInterval(id);
  }, [loadNews]);

  return (
    <Card className="border-primary/15 shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Newspaper className="w-5 h-5 text-primary" />
          {t('news.title')}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => loadNews(true)} aria-label={t('news.refresh')} disabled={loading}>
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {loading && articles.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">{t('news.loading')}</span>
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t('news.error')}</p>
        ) : (
          <ul className="divide-y divide-border">
            {articles.slice(0, 5).map((a, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="group block">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">{a.title}</h3>
                    <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{a.summary}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <ExternalLink className="w-3 h-3" />
                      {a.source}
                    </span>
                    {a.date && (
                      <>
                        <span>·</span>
                        <span>{new Date(a.date).toLocaleDateString(lang === 'it' ? 'it-IT' : undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                  <NewsShareButtons title={a.title} summary={a.summary} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}