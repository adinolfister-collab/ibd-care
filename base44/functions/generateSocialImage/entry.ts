import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// Genera un'immagine AI per un post social. Admin-only.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const text = String(body.text || '').trim().slice(0, 800);
    if (!text) return Response.json({ error: 'Testo del post mancante' }, { status: 400 });
    const format = ['square', 'landscape', 'portrait'].includes(body.format) ? body.format : 'square';
    const ratio = { square: '1:1 square', landscape: '16:9 landscape', portrait: '4:5 portrait' }[format];

    const prompt =
      `Clean, calming social media image for a health & wellness app about inflammatory bowel disease (IBD, Crohn's, colitis). ` +
      `Palette of deep teal and warm terracotta with cream tones, soft natural lighting, minimal composition, reassuring and hopeful mood. ` +
      `No text, no letters, no words, no watermark. ${ratio} composition. Visual concept inspired by this post: ${text}`;

    const result = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
    if (!result?.url) return Response.json({ error: 'Nessuna immagine restituita' }, { status: 502 });
    return Response.json({ url: result.url });
  } catch (error) {
    console.error('generateSocialImage', error);
    return Response.json({ error: error.message || 'Errore generazione immagine' }, { status: 500 });
  }
}