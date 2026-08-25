import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(s) {
  const stop = new Set(['il','lo','la','i','gli','le','di','del','della','dei','delle','da','in','con','per','e','ed','a','al','allo','alla','ai','agli','alle','un','uno','una','esame','visita','referto','controllo','sangue','del','della']);
  return new Set(normalize(s).split(' ').filter((x) => x.length > 2 && !stop.has(x)));
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0; a.forEach((x) => { if (b.has(x)) inter++; });
  return inter / (a.size + b.size - inter);
}
// Confronta i dati estratti con l'archivio dell'utente per evitare duplicati.
async function findDuplicate(base44, type, date, title, examCategory, markers, isTherapy, medName, medStart) {
  try {
    if (isTherapy) {
      const meds = await base44.entities.Medication.list('-start_date', 500);
      const nm = normalize(medName || '');
      const match = meds.find((m) => normalize(m.name || '') === nm && (m.start_date || '') === (medStart || date || ''));
      return match ? { exists: true, record_id: match.id, reason: 'Terapia già presente con stessa data di inizio' } : { exists: false };
    }
    const recs = await base44.entities.MedicalRecord.list('-record_date', 500);
    const tTok = tokens(title || '');
    const markerNames = new Set((markers || []).filter((m) => m && m.name).map((m) => normalize(m.name)));
    for (const r of recs) {
      if ((r.record_date || '') !== (date || '')) continue;
      if (type && (r.type || '') !== type) continue;
      if (examCategory && (r.exam_category || '') && (r.exam_category || '') !== examCategory) continue;
      const rTok = tokens(r.title || '');
      if (tTok.size && rTok.size && jaccard(tTok, rTok) >= 0.6) return { exists: true, record_id: r.id, reason: 'Titolo e data coincidenti' };
      if (markerNames.size && (r.markers || []).some((m) => m && markerNames.has(normalize(m.name)))) return { exists: true, record_id: r.id, reason: 'Stessi marker e stessa data' };
    }
    return { exists: false };
  } catch (e) {
    return { exists: false, error: e.message };
  }
}

// Scansione referti sanitari per IBD.
// Due modalità:
//  - legacy: exam_category fornito (esame_sangue|calprotectina|colonscopia|ecografia)
//    -> restituisce title, exam_date, provider, markers, findings, summary
//    (usata dal componente ExamScanner esistente).
//  - auto: nessun exam_category -> rileva automaticamente record_type
//    (visita|esame|esame_sangue|referto|controllo|terapia), exam_category,
//    record_date e (per le terapie) i dati del farmaco.
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
    if (category != null && !CATEGORIES.has(category)) return Response.json({ error: 'categoria non valida' }, { status: 400 });

    const ALLOWED_HOSTS = new Set(['media.base44.com', 'static.wixstatic.com']);
    let parsedUrl;
    try { parsedUrl = new URL(fileUrl); } catch (e) { return Response.json({ error: 'file_url non valido' }, { status: 400 }); }
    if (parsedUrl.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsedUrl.hostname) || fileUrl.length > 2048) {
      return Response.json({ error: 'file_url non valido' }, { status: 400 });
    }

    // ---- Modalità legacy: categoria fissa (ExamScanner) ----
    if (category) {
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
        prompt, file_urls: [fileUrl], model: 'gemini_3_flash', response_json_schema: schema
      });
      const dupe = await findDuplicate(base44, '', result.exam_date, result.title, category, result.markers, false, '', '');
      return Response.json({ extracted: result, duplicate: dupe });
    }

    // ---- Modalità auto: rilevamento sezione e data ----
    const schema = {
      type: 'object',
      properties: {
        record_type: { type: 'string', enum: ['visita', 'esame', 'esame_sangue', 'referto', 'controllo', 'terapia'], description: 'Tipo di documento' },
        exam_category: { type: 'string', description: 'Uno tra: esame_sangue, calprotectina, colonscopia, ecografia. Stringa vuota se non applicabile' },
        record_date: { type: 'string', description: 'Data del documento in formato AAAA-MM-GG' },
        title: { type: 'string', description: 'Titolo conciso del documento' },
        provider: { type: 'string', description: 'Medico, centro o struttura' },
        location: { type: 'string', description: 'Luogo/struttura' },
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
          },
          description: 'Parametri numerici (esami del sangue, calprotectina)'
        },
        findings: { type: 'string', description: 'Reperti descrittivi (visite, colonscopia, ecografia, referti)' },
        result_summary: { type: 'string', description: 'Sintesi breve del referto/visita' },
        next_appointment: { type: 'string', description: 'Prossimo appuntamento in AAAA-MM-GG se citato, stringa vuota altrimenti' },
        medication: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome del farmaco (vuoto se non terapia)' },
            type: { type: 'string', description: 'Uno tra: farmaco_orale, iniezione, biologico, integratore (vuoto se non terapia)' },
            dosage: { type: 'string', description: 'Dosaggio (es. 2g, 50 mg/ml)' },
            frequency: { type: 'string', description: 'Uno tra: giornaliero, settimanale, bisettimanale, mensile, al_bisogno (vuoto se non terapia)' },
            start_date: { type: 'string', description: 'Data di inizio in AAAA-MM-GG' },
            notes: { type: 'string' }
          },
          required: ['name', 'type', 'dosage', 'frequency', 'start_date', 'notes'],
          description: 'Compilare con i dati del farmaco SOLO se record_type=terapia, altrimenti tutti i campi vuoti'
        }
      },
      required: ['record_type', 'record_date', 'title', 'markers', 'findings', 'result_summary', 'medication']
    };

    const prompt = `Sei un assistente che legge documenti medici di pazienti con IBD (malattia infiammatoria intestinale) e li cataloga in un archivio personale.
Riconosci automaticamente il tipo di documento:
- "visita": visita/gastroenterologica/ambulatoriale
- "esame": esame strumentale generico
- "esame_sangue": esami del sangue con valori numerici (emocromo, PCR, VES, ferritina, calprotectina...)
- "referto": referto/lettera di dimissione o consulenza
- "controllo": controllo clinico di follow-up
- "terapia": prescrizione/ricetta farmacologica
Per esame_sangue imposta anche exam_category="esame_sangue"; per calprotectina fecale exam_category="calprotectina"; per colonscopia exam_category="colonscopia"; per ecografia intestinale exam_category="ecografia". Negli altri casi exam_category stringa vuota.
Per gli esami del sangue e la calprotectina estrai ogni marker con valore, unità e range di riferimento; imposta flag "high" se valore > ref_high, "low" se < ref_low, "normal" altrimenti.
Per visite/colonscopia/ecografia/referti usa "findings" con i reperti descrittivi.
Per le terapie compila "medication" con nome farmaco, tipo, dosaggio, frequenza e data inizio.
Leggi il documento allegato e restituisci SOLO i dati nello schema JSON richiesto. Date in formato AAAA-MM-GG (se non rilevata usa la data odierna). Se un dato non è presente usa stringa vuota. Usa la lingua del documento per i contenuti (testo).`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt, file_urls: [fileUrl], model: 'gemini_3_flash', response_json_schema: schema
    });
    const isTherapy = result.record_type === 'terapia';
    const dupe = await findDuplicate(
      base44,
      isTherapy ? '' : result.record_type,
      result.record_date,
      result.title,
      result.exam_category,
      result.markers,
      isTherapy,
      result.medication && result.medication.name,
      result.medication && result.medication.start_date
    );
    return Response.json({ extracted: result, duplicate: dupe });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}