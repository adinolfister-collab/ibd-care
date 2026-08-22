export const SUPPORTED_LANGS = ['it', 'en', 'es', 'fr', 'de', 'ru', 'pl', 'ro', 'sq'] as const;

export const ARTICLE_JSON_SCHEMA = {
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
};

export function buildNewsPrompt(lang: string): string {
  return 'Sei un aggregatore di notizie mediche. Cerca sul web le notizie e gli aggiornamenti più recenti e rilevanti sulle malattie infiammatorie intestinali (IBD: malattia di Crohn e colite ulcerosa). Considera solo notizie pubblicate negli ultimi 14 giorni. Restituisci esclusivamente le 6 notizie più recenti come JSON con la seguente struttura per ogni articolo: { "title": string, "summary": string (2-3 frasi), "source": string (nome della fonte/sito), "url": string, "date": string (formato ISO, es. 2026-08-18) }. Ordina per data decrescente (la piu recente prima). Suggerisci solo fonti autorevoli (siti medici, enti di ricerca, riviste specializzate). Lingua delle notizie: ' + lang + '.';
}

export function normalizeLang(raw: unknown): string {
  if (typeof raw === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(raw)) {
    return raw;
  }
  return 'it';
}