import { useEffect } from 'react';
import {
  SITE_BASE,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  DEFAULT_DESC,
  upsertMeta,
  upsertLink,
} from '@/lib/seo';

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

    const cleanPath = path || window.location.pathname;
    const url = SITE_BASE + cleanPath;
    upsertLink('canonical', url);
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: url });

    const robots = noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
  }, [title, description, path, image, type, noindex]);
}