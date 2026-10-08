import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AppLayout from '@/components/AppLayout';
import PublicFooter from '@/components/PublicFooter';
import GuideBody from '@/components/guides/GuideBody';
import { usePageMeta } from '@/hooks/usePageMeta';
import { guidePath } from '@/lib/guidePaths';

export default function GuideArticle({ lang = 'it' }) {
  const { slug } = useParams();
  const [guide, setGuide] = useState(undefined);
  const en = lang === 'en';

  useEffect(() => {
    setGuide(undefined);
    base44.entities.Guide.filter({ status: 'published', language: lang, slug })
      .then((r) => setGuide(r?.[0] || null))
      .catch(() => setGuide(null));
  }, [lang, slug]);

  usePageMeta({
    title: guide ? (guide.seo_title || guide.title) : undefined,
    description: guide?.meta_description,
    path: guide ? guidePath(lang, guide.slug) : undefined,
    type: 'article',
    noindex: guide === null,
  });

  return (
    <AppLayout>
      <div className="w-full max-w-2xl mx-auto">
        <Link to={en ? '/en/guide' : '/guide'} className="text-sm text-primary underline">
          {en ? '← All guides' : '← Tutte le guide'}
        </Link>
        <div className="mt-4">
          {guide === undefined && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}
          {guide === null && <p className="text-muted-foreground">{en ? 'Guide not found.' : 'Guida non trovata.'}</p>}
          {guide && (
            <>
              <GuideBody guide={guide} />
              {guide.translation_slug && (
                <Link to={guidePath(en ? 'it' : 'en', guide.translation_slug)} className="block mt-8 text-sm text-primary underline">
                  {en ? 'Leggi in italiano' : 'Read in English'}
                </Link>
              )}
            </>
          )}
        </div>
        <PublicFooter />
      </div>
    </AppLayout>
  );
}