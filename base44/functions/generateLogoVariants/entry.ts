import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Genera 4 varianti di logo a simbolo medico astratto per la dashboard marketing.
// Sposta la chiamata GenerateImage lato server (asServiceRole) perché il client
// frontend non puo' invocare direttamente le integration Core (falliva silenziosamente).
// Accetta body.promptBase (stringa) e body.variations (array di prompt string);
// restituisce { logos: [{ url, error } | null] } allineato alle variazioni richieste.
const DEFAULT_PROMPT_BASE =
  'Minimal abstract medical logo for a gut health (IBD: Crohn and Colitis) care app. ' +
  'Soft, calming, organic abstract symbol evoking an intestine wave, gentle flowing lines, ' +
  'rounded forms, clean and modern. Palette: deep teal #2c5f5d and warm terracotta #c97b5a ' +
  'on a clean off-white background. No text, no letters, no words. Centered, balanced, ' +
  'high-end editorial feel, photographic, crisp, premium app identity. Square composition.';

const DEFAULT_VARIATIONS = [
  'Single flowing line forming a soft spiral/intestine motif, centered, lots of breathing space.',
  'Two interwoven organic ribbons forming a calm protective shape, symmetrical and elegant.',
  'Abstract concentric soft waves radiating from center, suggesting care and balance, minimalist.',
  'Negative-space leaf-and-gut hybrid glyph, rounded, warm and human, refined and distinctive.',
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const promptBase = String(body.promptBase || DEFAULT_PROMPT_BASE).slice(0, 2000);
    const variations = Array.isArray(body.variations) && body.variations.length
      ? body.variations.slice(0, 6).map((v) => String(v).slice(0, 1000))
      : DEFAULT_VARIATIONS;

    const results = await Promise.all(
      variations.map(async (variation) => {
        try {
          const out = await base44.asServiceRole.integrations.Core.GenerateImage({
            prompt: `${promptBase} ${variation}`,
          });
          return { url: out?.url || null, error: out?.url ? null : 'Nessun URL' };
        } catch (e) {
          console.error('generateLogoVariants', e);
          return { url: null, error: e?.message || 'errore generazione' };
        }
      })
    );

    return Response.json({ logos: results });
  } catch (error) {
    console.error('generateLogoVariants fatal', error);
    return Response.json({ error: error.message || 'Errore generazione loghi' }, { status: 500 });
  }
}