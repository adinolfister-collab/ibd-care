// Google Play Developer API auth: builds a signed JWT from a service account
// key JSON and exchanges it for an OAuth2 access token (scope androidpublisher).
// Shared by verifyPlayPurchase and handlePlayBillingWebhook.

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s/g, '');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function strToUint8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function bufToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

let cachedToken: { token: string; exp: number } | null = null;

export async function getGoogleAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.exp > Date.now() + 60000) return cachedToken.token;

  const saRaw = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT') || (globalThis as any).GOOGLE_PLAY_SERVICE_ACCOUNT;
  if (!saRaw) return null;
  let sa: any;
  try { sa = JSON.parse(saRaw); } catch { return null; }
  if (!sa.private_key || !sa.client_email) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const enc = (o: any) => bufToBase64Url(strToUint8(JSON.stringify(o)).buffer as ArrayBuffer);
  const unsigned = `${enc(header)}.${enc(claim)}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, strToUint8(unsigned));
  const jwt = `${unsigned}.${bufToBase64Url(sig)}`;

  const body = new URLSearchParams();
  body.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  body.set('assertion', jwt);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!data.access_token) return null;
  cachedToken = { token: data.access_token, exp: (data.expires_in ? now + data.expires_in : now + 3500) * 1000 };
  return cachedToken.token;
}