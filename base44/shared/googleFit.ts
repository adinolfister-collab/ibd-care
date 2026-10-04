import { secrets } from "base44:runtime";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const AGGREGATE_URL = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate";

const SCOPES = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.body.read",
].join(" ");

export function getCredentials() {
  const clientId = secrets.get("google_oauth_client_id");
  const clientSecret = secrets.get("google_oauth_client_secret");
  const redirectUri = secrets.get("google_fit_redirect_uri");
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Configurazione Google Fit mancante: imposta google_oauth_client_id, google_oauth_client_secret e google_fit_redirect_uri nei secret.");
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildAuthUrl(state: string): string {
  const { clientId, redirectUri } = getCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getCredentials();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Scambio token fallito: ${text}`);
  return JSON.parse(text);
}

export async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getCredentials();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Refresh token fallito: ${text}`);
  return JSON.parse(text);
}

export interface DayAggregate {
  date: string;
  steps: number;
  kcal_expended: number;
  distance_m: number;
  weight_kg: number | null;
}

export async function fetchAggregates(
  accessToken: string,
  startTimeMillis: number,
  endTimeMillis: number
): Promise<DayAggregate[]> {
  const body = {
    aggregateBy: [
      { dataTypeName: "com.google.step_count.delta" },
      { dataTypeName: "com.google.calories.expended" },
      { dataTypeName: "com.google.distance.delta" },
      { dataTypeName: "com.google.weight" },
    ],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis,
    endTimeMillis,
  };
  const res = await fetch(AGGREGATE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google Fit aggregate fallito: ${text}`);
  const data = JSON.parse(text);
  return parseBuckets(data.bucket || []);
}

function parseBuckets(buckets: any[]): DayAggregate[] {
  const days: DayAggregate[] = [];
  for (const bucket of buckets) {
    const date = new Date(Number(bucket.startTimeMillis)).toISOString().slice(0, 10);
    const day: DayAggregate = { date, steps: 0, kcal_expended: 0, distance_m: 0, weight_kg: null };
    for (const ds of bucket.dataset || []) {
      const src = String(ds.dataSourceId || "");
      for (const point of ds.point || []) {
        const val = (point.value && point.value[0]) || {};
        if (src.includes("step_count")) {
          day.steps += val.intVal || 0;
        } else if (src.includes("calories.expended")) {
          day.kcal_expended += val.fpVal || 0;
        } else if (src.includes("distance")) {
          day.distance_m += val.fpVal || 0;
        } else if (src.includes("weight")) {
          if (val.fpVal) day.weight_kg = val.fpVal;
        }
      }
    }
    days.push(day);
  }
  return days;
}