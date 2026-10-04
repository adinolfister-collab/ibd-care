import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { buildAuthUrl } from '../../shared/googleFit.ts';

// Restituisce l'URL di consenso OAuth di Google Fit per l'utente corrente.
// Il frontend reindirizza l'utente a questo URL; dopo il consenso Google
// rimanda al redirect_uri (/settings) con ?code=... che il frontend passa
// a connectGoogleFit per scambiare i token.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const authUrl = buildAuthUrl(String(user.id));
    return Response.json({ auth_url: authUrl });
  } catch (error) {
    console.error('startGoogleFitAuth', error);
    return Response.json({ error: String((error && error.message) || error) }, { status: 500 });
  }
}