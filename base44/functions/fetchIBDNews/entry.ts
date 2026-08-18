import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { normalizeLang } from '../../shared/ibdNews.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const rawLang = await req.json().then((b) => b && b.lang).catch(() => undefined);
    const lang = normalizeLang(rawLang);

    const articles = await base44.entities.NewsArticle.filter({ lang }, '-date', 6);
    return Response.json({ articles: articles || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}