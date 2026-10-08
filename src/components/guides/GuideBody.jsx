import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// Corpo della guida + FAQ visibili; il JSON-LD FAQPage è emesso solo se ci sono FAQ.
export default function GuideBody({ guide, jsonLd = true }) {
  const faq = (guide.faq || []).filter((f) => f.question && f.answer);

  useEffect(() => {
    if (!jsonLd || faq.length === 0) return undefined;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-guide-faq', '1');
    el.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
    document.head.appendChild(el);
    return () => el.remove();
  }, [jsonLd, JSON.stringify(faq)]);

  return (
    <article data-selectable>
      <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
        {guide.title}
      </h1>
      <div className="h-px bg-terracotta/70 my-5" />
      <div className="prose max-w-none text-foreground/90 leading-relaxed [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_a]:text-primary [&_a]:underline">
        <ReactMarkdown>{guide.content || ''}</ReactMarkdown>
      </div>
      {faq.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-2xl mb-4">{guide.language === 'en' ? 'FAQ' : 'Domande frequenti'}</h2>
          <div className="space-y-4">
            {faq.map((f, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold">{f.question}</h3>
                <p className="mt-1 text-sm text-foreground/80">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}