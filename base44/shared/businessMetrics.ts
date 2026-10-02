// Catalogo piani Base44 + costanti di stima crediti + proiezione business.
// Condiviso dalle funzioni backend che calcolano/salvano gli snapshot business.
// La pagina admin ne mantiene uno specchio frontend in src/lib/businessPlans.js
// per i calcoli what-if istantanei lato client; tenere i due cataloghi allineati.

export interface PlanDef {
  id: string;
  name: string;
  cost: number;            // $/mese (fatturazione annuale)
  msgCredits: number;
  integrationCredits: number;
  custom: boolean;
}

export const BASE44_PLANS: PlanDef[] = [
  { id: 'free', name: 'Free', cost: 0, msgCredits: 25, integrationCredits: 100, custom: false },
  { id: 'starter', name: 'Starter', cost: 16, msgCredits: 100, integrationCredits: 2000, custom: false },
  { id: 'builder', name: 'Builder', cost: 40, msgCredits: 250, integrationCredits: 10000, custom: false },
  { id: 'pro', name: 'Pro', cost: 80, msgCredits: 500, integrationCredits: 20000, custom: false },
  { id: 'elite', name: 'Elite', cost: 160, msgCredits: 1200, integrationCredits: 50000, custom: false },
  // Piano attuale dell'app: Elite personalizzato (crediti scelti dal dropdown).
  { id: 'elite_custom', name: 'Elite personalizzato', cost: 160, msgCredits: 1628, integrationCredits: 72678, custom: true },
];

export const DEFAULT_PLAN_ID = 'elite_custom';
export const DEFAULT_PREMIUM_PRICE = 4.99;
export const DEFAULT_AVG_MSGS_PER_CARY_USER = 12;

// Crediti Base44 stimati per singolo messaggio Cary (risposta LLM dell'agente).
export const MSG_CREDITS_PER_CARY_MSG = 1;
export const INTEGRATION_CREDITS_PER_CARY_MSG = 3;

// Soglia (0-1) oltre la quale il consumo crediti entra in zona di attenzione.
export const CREDIT_WARNING_THRESHOLD = 0.8;

export function getPlan(id: string): PlanDef {
  return BASE44_PLANS.find((p) => p.id === id) || BASE44_PLANS.find((p) => p.id === DEFAULT_PLAN_ID)!;
}

// Classifica un utente in fascia abbonamento a partire dai campi del profilo.
export type UserTier = 'premium' | 'trial' | 'none';
export function classifyUser(u: any): UserTier {
  const status = u.subscription_status;
  if (['active', 'lifetime', 'three_months', 'past_due'].includes(status)) return 'premium';
  if (status === 'trialing') return 'trial';
  if (u.free_until) {
    const end = new Date(u.free_until).getTime();
    if (!isNaN(end) && end > Date.now()) return 'trial';
  }
  return 'none';
}

export interface CaryAdoption {
  premium: number; // %
  trial: number;   // %
  demo: number;    // %
}

export interface ProjectionInput {
  plan: PlanDef;
  premiumUsers: number;
  trialUsers: number;
  demoUsers: number;
  caryAdoption: CaryAdoption; // %
  avgMsgsPerCaryUser: number;
  premiumPrice: number;
}

export interface ProjectionResult {
  premiumCaryUsers: number;
  trialCaryUsers: number;
  demoCaryUsers: number;
  authenticatedCaryUsers: number;
  msgCreditsUsed: number;
  integrationCreditsUsed: number;
  msgCreditsHeadroom: number;
  integrationCreditsHeadroom: number;
  msgCreditsPct: number;   // % del piano usato
  integrationCreditsPct: number;
  revenue: number;
  cost: number;
  margin: number;
  marginPct: number;
  breakEvenUsers: number | null;
  verdict: 'profit' | 'warning' | 'loss';
}

export function computeProjection(input: ProjectionInput): ProjectionResult {
  const { plan, premiumUsers, trialUsers, demoUsers, caryAdoption, avgMsgsPerCaryUser, premiumPrice } = input;
  const premiumCaryUsers = Math.round((premiumUsers * caryAdoption.premium) / 100);
  const trialCaryUsers = Math.round((trialUsers * caryAdoption.trial) / 100);
  const demoCaryUsers = Math.round((demoUsers * caryAdoption.demo) / 100);
  const authenticatedCaryUsers = premiumCaryUsers + trialCaryUsers;

  const msgCreditsUsed = authenticatedCaryUsers * avgMsgsPerCaryUser * MSG_CREDITS_PER_CARY_MSG;
  const integrationCreditsUsed = authenticatedCaryUsers * avgMsgsPerCaryUser * INTEGRATION_CREDITS_PER_CARY_MSG;

  const msgCreditsHeadroom = plan.msgCredits - msgCreditsUsed;
  const integrationCreditsHeadroom = plan.integrationCredits - integrationCreditsUsed;
  const msgCreditsPct = plan.msgCredits > 0 ? Math.round((msgCreditsUsed / plan.msgCredits) * 100) : 0;
  const integrationCreditsPct = plan.integrationCredits > 0 ? Math.round((integrationCreditsUsed / plan.integrationCredits) * 100) : 0;

  const revenue = premiumUsers * premiumPrice;
  const cost = plan.cost;
  const margin = revenue - cost;
  const marginPct = cost > 0 ? Math.round((margin / cost) * 100) : (revenue > 0 ? 100 : 0);
  const breakEvenUsers = premiumPrice > 0 ? Math.ceil(cost / premiumPrice) : null;

  let verdict: 'profit' | 'warning' | 'loss' = 'profit';
  if (margin < 0) {
    verdict = 'loss';
  } else if (
    msgCreditsUsed > plan.msgCredits * CREDIT_WARNING_THRESHOLD ||
    integrationCreditsUsed > plan.integrationCredits * CREDIT_WARNING_THRESHOLD ||
    margin < cost * 0.2
  ) {
    verdict = 'warning';
  }

  return {
    premiumCaryUsers, trialCaryUsers, demoCaryUsers, authenticatedCaryUsers,
    msgCreditsUsed, integrationCreditsUsed, msgCreditsHeadroom, integrationCreditsHeadroom,
    msgCreditsPct, integrationCreditsPct,
    revenue, cost, margin, marginPct, breakEvenUsers, verdict,
  };
}