import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Scansione referti sanitari: estrae dati strutturati da un documento caricato
// (immagine o PDF) usando un modello vision, per i pazienti IBD.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fileUrl = body && body.file_url;
    const category = body && body.exam_category;
    const CATEGORIES = new Set(['esame_sangue', 'calprotectina', 'colonscopia', 'ecografia']);
    if (!fileUrl || typeof fileUrl !== 'string') return Response.json({ error: 'file_url mancante' }, { status: 400 });
    if (!category || !CATEGORIES.has(category)) return Response.json({ error: 'categoria non valida' }, { status: 400 });

    const ALLOWED_HOSTS = new Set(['media.base44.com', 'static.wixstatic.com']);
    let parsedUrl;
    try { parsedUrl = new URL(fileUrl); } catch (e) { return Response.json({ error: 'file_url non valido' }, { status: 400 }); }
    if (parsedUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsedUrl.hostname) || fileUrl.length > 2048) {
      return Response.json({ error: 'file_url non valido' }, { status: 400 });
    }

    const guidance = {
      esame_sangue: 'Esame del sangue. Estrai ogni parametro con valore numerico, unità di misura e range di riferimento (valori normali min-max). Esempi: PCR, VES, emoglobina, ferritina, leucociti, piastrine, albumina, GSR. Imposta flag "high" se valore > ref_high, "low" se < ref_low, "normal" altrimenti.',
      calprotectina: 'Calprotectina fecale. Estrai il valore principale (mg/kg o µg/g) con range di riferimento. Flag come per esame del sangue.',
      colonscopia: 'Colonscopia. In "findings" estrai i reperti descrittivi: estensione della malattia, aspetto della mucosa, lesioni, ulcerazioni, biopsie eseguite. markers vuoto.',
      ecografia: 'Ecografia intestinale/addominale. In "findings" estrai i reperti descrittivi: spessore della parete, alterazioni, liquidi, linfonodi. markers vuoto.'
    }[category];

    const schema = {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Titolo conciso del referto' },
        exam_date: { type: 'string', description: 'Data esame in formato AAAA-MM-GG' },
        provider: { type: 'string', description: 'Medico o centro' },
        markers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
              unit: { type: 'string' },
              ref_low: { type: 'string' },
              ref_high: { type: 'string' },
              flag: { type: 'string', enum: ['normal', 'high', 'low'] }
            },
            required: ['name']
          }
        },
        findings: { type: 'string', description: 'Reperti descrittivi per colonscopia/ecografia' },
        summary: { type: 'string', description: 'Sintesi breve del referto' }
      },
      required: ['title', 'markers', 'findings']
    };

    const prompt = `Sei un assistente che estrae dati strutturati da referti medici per pazienti con IBD (malattia infiammatoria intestinale). ${guidance} Leggi il documento allegato e restituisci SOLO i dati nello schema JSON richiesto. Date sempre in formato AAAA-MM-GG. Se un dato non è presente usa stringa vuota. Usa la lingua del referto per i contenuti (testo).`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [fileUrl],
      model: 'gemini_3_flash',
      response_json_schema: schema
    });

    return Response.json({ extracted: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}