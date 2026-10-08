export const SUPPORTED_LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt', 'ru', 'pl', 'ro', 'sq', 'zh'] as const;

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
          date: { type: 'string' },
          is_ibd_related: { type: 'boolean' }
        },
        required: ['title', 'summary', 'source', 'url', 'is_ibd_related']
      }
    }
  },
  required: ['articles']
};

export function buildNewsPrompt(lang: string): string {
  return 'Sei un aggregatore di notizie mediche. Cerca sul web le notizie e gli aggiornamenti più recenti e rilevanti sulle malattie infiammatorie intestinali (IBD: malattia di Crohn e colite ulcerosa). Considera solo notizie pubblicate negli ultimi 14 giorni. Restituisci esclusivamente le 20 notizie più recenti come JSON con la seguente struttura per ogni articolo: { "title": string, "summary": string (2-3 frasi), "source": string (nome della fonte/sito), "url": string, "date": string (formato ISO, es. 2026-08-18), "is_ibd_related": boolean (true solo se l\'articolo tratta davvero di Crohn, colite ulcerosa o IBD, non di IBS, dieta generica o altre patologie) }. Escludi articoli non pertinenti all\'IBD. Ordina per data decrescente (la piu recente prima). Suggerisci solo fonti autorevoli (siti medici, enti di ricerca, riviste specializzate). Lingua delle notizie: ' + lang + '.';
}

const IBD_TERMS = /crohn|colitis|colite|ibd|mici|inflammatory bowel|infiammatori|intestinal|entzündliche darm|darmerkrankung|colitis ulcerosa|maladies inflammatoires|doenças inflamatórias|doença de crohn|wzjb|choroba leśniowskiego|boala crohn|colita|bowel|воспалительн|крон|язвенн|克罗恩|结肠炎|炎症性肠|kolit|zorrë/i;

// Mantiene solo articoli pertinenti all'IBD, recenti (30 gg) e non duplicati.
export function filterArticles(articles: any[]): any[] {
  const seen = new Set<string>();
  const minTime = Date.now() - 30 * 24 * 3600 * 1000;
  return (articles || []).filter((a) => {
    if (!a || !a.title || !a.url || a.is_ibd_related === false) return false;
    if (!IBD_TERMS.test(`${a.title} ${a.summary || ''}`)) return false;
    const t = a.date ? Date.parse(a.date) : NaN;
    if (!isNaN(t) && t < minTime) return false;
    const key = String(a.url).split('#')[0].replace(/\/$/, '').toLowerCase();
    const tkey = String(a.title).trim().toLowerCase();
    if (seen.has(key) || seen.has(tkey)) return false;
    seen.add(key); seen.add(tkey);
    return true;
  });
}

export function normalizeLang(raw: unknown): string {
  if (typeof raw === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(raw)) {
    return raw;
  }
  return 'it';
}