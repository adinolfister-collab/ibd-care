import { useEffect } from 'react';
import {
  SITE_BASE,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  DEFAULT_DESC,
  upsertMeta,
  upsertLink,
} from '@/lib/seo';
import { supportedLanguages } from '@/lib/i18n/locales';

// Costruisce l'URL canonico includendo ?lang=XX (eccetto italiano, che resta pulito).
function buildCanonicalUrl(path) {
  const cleanPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const lang =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('lang')
      : null;
  const suffix = lang && lang !== 'it' ? `?lang=${lang}` : '';
  return SITE_BASE + cleanPath + suffix;
}

// Emette i <link rel="alternate" hreflang> per ogni lingua supportata.
// Rimuove i precedenti (segnalati con data-hreflang) prima di reinserirli.
function syncHreflang(path) {
  const cleanPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((el) => el.remove());
  supportedLanguages.forEach(({ code }) => {
    const href = SITE_BASE + cleanPath + (code === 'it' ? '' : `?lang=${code}`);
    const el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', code);
    el.setAttribute('href', href);
    document.head.appendChild(el);
  });
  const xdef = document.createElement('link');
  xdef.setAttribute('rel', 'alternate');
  xdef.setAttribute('hreflang', 'x-default');
  xdef.setAttribute('href', SITE_BASE + cleanPath);
  document.head.appendChild(xdef);
}

// Aggiorna i meta tag lato client ad ogni cambio pagina.
// Riusa gli elementi statici presenti in index.html (nessun duplicato).
export function usePageMeta({ title, description, path, image, type = 'website', noindex = false }) {
  useEffect(() => {
    const fullTitle = title
      ? (title.includes('IBD Care') ? title : `${title} · IBD Care`)
      : DEFAULT_TITLE;
    document.title = fullTitle;

    const desc = description || DEFAULT_DESC;
    upsertMeta('meta[name="description"]', { name: 'description', content: desc });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: desc });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: desc });

    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type });

    const img = image || DEFAULT_OG_IMAGE;
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: img });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: img });

    const url = buildCanonicalUrl(path);
    upsertLink('canonical', url);
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });

    syncHreflang(path);

    const robots = noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
  }, [title, description, path, image, type, noindex]);
}