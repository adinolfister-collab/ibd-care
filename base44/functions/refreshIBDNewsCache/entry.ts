import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { SUPPORTED_LANGS, buildNewsPrompt, ARTICLE_JSON_SCHEMA, filterArticles } from '../../shared/ibdNews.ts';

export default async function(req) {
  const base44 = createClientFromRequest(req);
  // Solo admin (il workflow schedulato gira con permessi admin); blocca anonimi.
  let user = null;
  try { user = await base44.auth.me(); } catch (_e) { user = null; }
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fetched = await Promise.all(SUPPORTED_LANGS.map(async (lang) => {
    try {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: buildNewsPrompt(lang),
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: ARTICLE_JSON_SCHEMA
      });
      return { lang, articles: filterArticles((result && result.articles) || []) };
    } catch (err) {
      console.error(`refreshIBDNewsCache fetch error for lang ${lang}:`, (err && err.message) || err);
      return { lang, error: (err && err.message) || String(err), articles: [] };
    }
  }));

  const results = [];
  for (const item of fetched) {
    try {
      const articles = item.articles || [];
      // Se non ci sono articoli validi, mantiene la cache esistente.
      if (articles.length > 0) {
        await base44.asServiceRole.entities.NewsArticle.deleteMany({ lang: item.lang });
        const records = articles.map((a) => ({
          title: String(a.title || ''),
          summary: String(a.summary || ''),
          source: String(a.source || ''),
          url: String(a.url || ''),
          date: a.date || new Date().toISOString().slice(0, 10),
          lang: item.lang
        }));
        await base44.asServiceRole.entities.NewsArticle.bulkCreate(records);
      }
      results.push({ lang: item.lang, count: articles.length, error: item.error || null });
    } catch (err) {
      console.error(`refreshIBDNewsCache persist error for lang ${item.lang}:`, (err && err.message) || err);
      results.push({ lang: item.lang, count: 0, error: (err && err.message) || String(err) });
    }
  }

  return Response.json({ ok: true, results });
}