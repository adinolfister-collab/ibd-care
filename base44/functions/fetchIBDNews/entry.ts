import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { normalizeLang } from '../../shared/ibdNews.ts';

// Public endpoint: the NewsArticle cache is informational content with no
// user data, so it is served to every visitor (including unauthenticated ones
// on the public Home page) without an auth check.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const rawLang = await req.json().then((b) => b && b.lang).catch(() => undefined);
    const lang = normalizeLang(rawLang);

    const articles = await base44.entities.NewsArticle.filter({ lang }, '-date', 6);
    return Response.json({ articles: articles || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}