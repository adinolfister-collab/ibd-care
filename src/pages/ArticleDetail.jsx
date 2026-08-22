import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Newspaper, Home as HomeIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import NewsShareButtons from '@/components/NewsShareButtons';
import TopRightActions from '@/components/TopRightActions';
import LanguageMenu from '@/components/LanguageMenu';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import AppLayout from '@/components/AppLayout';
import SiteMenu from '@/components/SiteMenu';
import { Card, CardContent } from '@/components/ui/card';

const APP_URL = 'https://ibd-care.it';

export default function ArticleDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await base44.functions.invoke('fetchIBDNews', { id });
        if (!alive) return;
        setArticle(res.data?.article || null);
      } catch (e) {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const deepLink = `${APP_URL}/news/${id}`;
  const locale = lang === 'it' ? 'it-IT' : undefined;

  const jsonLd = article ? {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title || '',
    description: article.summary || '',
    datePublished: article.date || undefined,
    dateModified: article.date || undefined,
    author: article.source ? [{ '@type': 'Organization', name: article.source }] : [{ '@type': 'Organization', name: 'IBD Care' }],
    publisher: { '@type': 'Organization', name: 'IBD Care' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': deepLink },
    image: article.image || undefined,
    inLanguage: lang,
    url: deepLink
  } : null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Link
          to="/news"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('news.back')}
        </Link>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">{t('news.loading')}</span>
          </div>
        ) : error || !article ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Newspaper className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t('news.not_found')}</p>
              <Link to="/" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary hover:underline">
                <ArrowLeft className="w-4 h-4" />
                {t('news.back')}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
          {jsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          )}
          <PageHeader title={article.title} subtitle={article.source ? `${article.source}` : undefined} />
          <PageEditorial pageKey="article" />
          <SiteMenu />
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1 font-medium">
                  <ExternalLink className="w-3 h-3" />
                  {article.source}
                </span>
                {article.date && (
                  <>
                    <span>·</span>
                    <span>{new Date(article.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </>
                )}
              </div>

              {article.summary && (
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line mb-6">{article.summary}</p>
              )}

              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('news.read_original')}
                </a>
              )}

              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('news.share')}</p>
                <NewsShareButtons title={article.title} summary={article.summary} shareUrl={deepLink} />
              </div>

              <div className="mt-6">
                <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                  <HomeIcon className="w-4 h-4" />
                  {t('news.home_cta')}
                </Link>
              </div>
            </CardContent>
          </Card>
          </>
        )}
        <EditorialBlock sectionKey="article_share" align="right" />
      </div>
    </AppLayout>
  );
}