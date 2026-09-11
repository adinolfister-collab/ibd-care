import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { message_id, target_lang, message_type = 'community' } = body || {};
    if (!message_id || !target_lang) {
      return Response.json({ error: 'message_id e target_lang obbligatori' }, { status: 400 });
    }

    const entityName = message_type === 'dm' ? 'DirectMessage' : 'CommunityMessage';
    // Service role: per DM serve leggere messaggi privati e aggiornare la cache
    const msg = await base44.asServiceRole.entities[entityName].get(message_id);
    if (!msg) return Response.json({ error: 'Messaggio non trovato' }, { status: 404 });

    // Authorization: per i DM privati, solo i partecipanti della conversazione
    // possono tradurre/leggere il messaggio. asServiceRole bypassa la RLS.
    if (message_type === 'dm') {
      const participants = Array.isArray(msg.participants) ? msg.participants : [];
      const isParticipant = msg.sender_id === user.id || participants.includes(user.id);
      if (!isParticipant) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const cache = msg.translated_text || {};
    if (cache[target_lang]) {
      return Response.json({ translated: cache[target_lang], original_lang: msg.original_lang || null, cached: true });
    }

    const text = msg.content || '';
    if (!text.trim()) {
      return Response.json({ translated: '', original_lang: msg.original_lang || null });
    }

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: 'You are a translator for an IBD (inflammatory bowel disease) patient community. Translate the user message to "' + target_lang + '". Output ONLY a JSON object with "lang" (2-letter ISO code of the ORIGINAL language) and "translation" (the translated text). Preserve tone, keep medical terms accurate, keep @mentions, emojis and shared-entry markers untouched. Message: """' + text + '"""',
      response_json_schema: {
        type: 'object',
        properties: {
          lang: { type: 'string' },
          translation: { type: 'string' }
        },
        required: ['lang', 'translation']
      }
    });

    const result = llm || {};
    const translation = (result.translation || text).trim();
    const detectedLang = result.lang || null;

    cache[target_lang] = translation;
    const updateData = { translated_text: cache };
    if (!msg.original_lang && detectedLang) updateData.original_lang = detectedLang;
    await base44.asServiceRole.entities[entityName].update(message_id, updateData);

    return Response.json({ translated: translation, original_lang: msg.original_lang || detectedLang, cached: false });
  } catch (error) {
    console.error('translateMessage', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}