import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AppLayout from '@/components/AppLayout';
import PublicFooter from '@/components/PublicFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { guidePath } from '@/lib/guidePaths';

export default function GuideIndex({ lang = 'it' }) {
  const [guides, setGuides] = useState(null);
  const en = lang === 'en';

  usePageMeta({
    title: en ? 'Guides for IBD patients' : 'Guide per pazienti con MICI',
    description: en
      ? 'Practical guides for people living with Crohn\'s disease and ulcerative colitis.'
      : 'Guide pratiche per chi convive con malattia di Crohn e colite ulcerosa.',
    path: en ? '/en/guide' : '/guide',
  });

  useEffect(() => {
    base44.entities.Guide.filter({ status: 'published', language: lang }, '-published_at', 100)
      .then((r) => setGuides(r || []))
      .catch(() => setGuides([]));
  }, [lang]);

  return (
    <AppLayout>
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl font-semibold">{en ? 'Guides' : 'Guide'}</h1>
        <div className="h-px bg-terracotta/70 my-5" />
        {guides === null && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}
        {guides && guides.length === 0 && (
          <p className="text-muted-foreground">{en ? 'No guides published yet.' : 'Nessuna guida pubblicata.'}</p>
        )}
        <div className="space-y-4">
          {(guides || []).map((g) => (
            <Link key={g.id} to={guidePath(g.language, g.slug)} className="block rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
              <h2 className="font-heading text-xl font-semibold">{g.title}</h2>
              {g.meta_description && <p className="mt-2 text-sm text-muted-foreground">{g.meta_description}</p>}
            </Link>
          ))}
        </div>
        <PublicFooter />
      </div>
    </AppLayout>
  );
}