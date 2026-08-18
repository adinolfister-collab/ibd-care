import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const authed = await base44.auth.isAuthenticated();
    if (!authed) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const SUPPORTED_LANGS = new Set(['it', 'en', 'es', 'fr', 'de']);
    const rawLang = await req.json().then(b => b?.lang).catch(() => undefined);
    const lang = typeof rawLang === 'string' && SUPPORTED_LANGS.has(rawLang) ? rawLang : 'it';

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'Sei un aggregatore di notizie mediche. Cerca sul web le notizie e gli aggiornamenti più recenti e rilevanti sulle malattie infiammatorie intestinali (IBD: malattia di Crohn e colite ulcerosa). Restituisci esclusivamente le 6 notizie più recenti come JSON con la seguente struttura per ogni articolo: { "title": string, "summary": string (2-3 frasi), "source": string (nome della fonte/sito), "url": string, "date": string (formato ISO o leggibile) }. Suggerisci solo fonti autorevoli (siti medici, enti di ricerca, riviste specializzate). Lingua delle notizie: ' + lang + '.',
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          articles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                source: { type: 'string' },
                url: { type: 'string' },
                date: { type: 'string' }
              },
              required: ['title', 'summary', 'source', 'url']
            }
          }
        },
        required: ['articles']
      }
    });

    return Response.json({ articles: result.articles || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}