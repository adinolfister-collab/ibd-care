import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Consigliere AI per il Cruscotto Crescita (admin-only).
// Riceve gli insight di getGrowthInsights + i target di marketing e
// restituisce 3 azioni concrete della settimana, ognuna con un action_type
// che il frontend mappa a un'azione eseguibile:
//  - dormant_reminders -> sendDormantReminders (modalita' campaign)
//  - social_post       -> generateSocialPost
//  - founders_invitations -> apertura pannello inviti founder
//  - none              -> consiglio testuale senza pulsante

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: any = {};
    try {
      const ct = req.headers.get('content-type') || '';
      if (ct.includes('application/json')) body = await req.json();
    } catch { /* ignore */ }
    const insights = body.insights || {};

    const prompt = `Sei il growth advisor di "IBD Care", app freemium per pazienti con IBD (morbo di Crohn, colite ulcerosa).
Obiettivo: aiutare l'admin a raggiungere i target di marketing (nessun budget a pagamento, solo canali organici).

Situazione attuale (ultimi 7 giorni vs settimana precedente):
${JSON.stringify(insights.kpis || [])}

Retention (coorti per settimana di registrazione):
${JSON.stringify(insights.retention || {})}

Driver di conversione (feature usate da chi poi si abbona):
${JSON.stringify(insights.drivers || [])}

Canali organici disponibili: community IBD (Reddit/Facebook), associazioni pazienti e centri gastro, video brevi Instagram/TikTok.
Azioni già eseguibili dal cruscotto: inviare reminder a utenti dormienti, generare un post social, aprire il pannello inviti founder.

Proponi ESATTAMENTE 3 azioni concrete per questa settimana, in ordine di priorità. Ogni azione deve avere:
- title: titolo breve (max 60 caratteri)
- description: cosa fare e perché, in 1-2 frasi (max 180 caratteri)
- priority: numero 1-3 (1 = più urgente)
- action_type: uno tra ["dormant_reminders", "social_post", "founders_invitations", "none"]
- action_label: etichetta del pulsante (max 30 caratteri) o null se action_type è "none"

Scegli action_type "none" solo quando l'azione non corrisponde a nessuno dei tre pulsanti.
Basati sui dati: se le registrazioni sono indietro, premi il post social; se la retention e' bassa, premi i reminder dormienti; se servono founder, proponi gli inviti.

Restituisci SOLO un JSON: { "actions": [ { "title","description","priority","action_type","action_label" } ] }`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          actions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'number' },
                action_type: { type: 'string' },
                action_label: { type: 'string' },
              },
              required: ['title', 'description', 'priority', 'action_type'],
            },
          },
        },
        required: ['actions'],
      },
    });

    const actions: any[] = Array.isArray(result?.actions) ? result.actions : [];
    const validTypes = new Set(['dormant_reminders', 'social_post', 'founders_invitations', 'none']);
    const normalized = actions.slice(0, 3).map((a, i) => ({
      title: String(a?.title || '').slice(0, 80),
      description: String(a?.description || '').slice(0, 220),
      priority: Number(a?.priority) || i + 1,
      action_type: validTypes.has(a?.action_type) ? a.action_type : 'none',
      action_label: a?.action_label ? String(a.action_label).slice(0, 40) : null,
    }));

    return Response.json({ actions: normalized });
  } catch (error) {
    return Response.json(
      { error: String((error && error.message) || error) },
      { status: 500 },
    );
  }
}