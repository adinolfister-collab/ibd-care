import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  BASE44_PLANS,
  DEFAULT_PLAN_ID,
  DEFAULT_PREMIUM_PRICE,
  DEFAULT_AVG_MSGS_PER_CARY_USER,
  MSG_CREDITS_PER_CARY_MSG,
  INTEGRATION_CREDITS_PER_CARY_MSG,
  getPlan,
  classifyUser,
  computeProjection,
} from '../../shared/businessMetrics.ts';

// Dashboard Business admin-only. Legge i dati live (utenti per fascia,
// adozione Cary per modalita' dal tracking ConversionEvent), calcola ricavi,
// costi, margine e break-even sul piano Base44 scelto, e:
//   mode='preview' (default) -> restituisce i metrici senza salvare
//   mode='save'              -> salva un record BusinessSnapshot e lo restituisce
// Argomenti opzionali (body): mode, source ('daily'|'manual'), base44PlanId,
// base44PlanCost, msgCreditsIncluded, integrationCreditsIncluded, premiumPrice,
// avgMsgsPerCaryUser. Per 'save' il source distingue l'origine dello snapshot.

const USER_LIMIT = 500;
const EVENT_LIMIT = 500;
const CARY_FEATURE = 'assistant_msg';
const WINDOW_DAYS = 30;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode: string = body.mode || 'preview';
    const source: string = body.source || 'manual';

    // Piano di riferimento (override dai parametri o default)
    const planId: string = body.base44PlanId || DEFAULT_PLAN_ID;
    const basePlan = getPlan(planId);
    const plan = {
      ...basePlan,
      cost: typeof body.base44PlanCost === 'number' ? body.base44PlanCost : basePlan.cost,
      msgCredits: typeof body.msgCreditsIncluded === 'number' ? body.msgCreditsIncluded : basePlan.msgCredits,
      integrationCredits: typeof body.integrationCreditsIncluded === 'number' ? body.integrationCreditsIncluded : basePlan.integrationCredits,
    };
    const premiumPrice: number = typeof body.premiumPrice === 'number' ? body.premiumPrice : DEFAULT_PREMIUM_PRICE;

    // Carica utenti ed eventi conversione (ultimi 30 gg). Servono sia gli
    // eventi Cary (per l'adozione) sia tutti gli eventi ospiti (per la base
    // totale dei visitatori demo), quindi si caricano senza filtro feature.
    const since = Date.now() - WINDOW_DAYS * 86400000;
    const [users, allEvents] = await Promise.all([
      base44.asServiceRole.entities.User.filter({}, '-created_date', USER_LIMIT).catch(() => []),
      base44.asServiceRole.entities.ConversionEvent.filter({}, '-created_date', EVENT_LIMIT).catch(() => []),
    ]);

    const userList = users as any[];
    const events = (allEvents as any[]).filter((e) => {
      const cd = e.created_date ? new Date(e.created_date).getTime() : 0;
      return cd >= since;
    });

    // Classifica utenti per fascia
    let premiumUsers = 0;
    let trialUsers = 0;
    const userTierMap: Record<string, string> = {};
    for (const u of userList) {
      const tier = classifyUser(u);
      userTierMap[String(u.id)] = tier;
      if (tier === 'premium') premiumUsers++;
      else if (tier === 'trial') trialUsers++;
    }

    // Base totale visitatori demo: distinct visitor_id da TUTTI gli eventi
    // ospiti (qualsiasi feature) negli ultimi 30 gg.
    const allDemoVisitorIds = new Set<string>();
    for (const e of events) {
      if (e.is_guest === true && e.visitor_id) allDemoVisitorIds.add(e.visitor_id);
    }
    const demoUsers = allDemoVisitorIds.size;

    // Visitatori demo che hanno usato Cary (feature assistant_msg)
    const demoCaryVisitorIds = new Set<string>();
    for (const e of events) {
      if (e.is_guest === true && e.feature === CARY_FEATURE && e.visitor_id) {
        demoCaryVisitorIds.add(e.visitor_id);
      }
    }

    // Eventi Cary autenticati (is_guest false/null, source 'used')
    const authEvents = events.filter((e) => e.is_guest !== true && e.source === 'used' && e.feature === CARY_FEATURE);
    const eventsByUser: Record<string, number> = {};
    for (const e of authEvents) {
      const uid = String(e.created_by_id || '');
      if (!uid) continue;
      eventsByUser[uid] = (eventsByUser[uid] || 0) + 1;
    }
    let premiumCaryUsers = 0;
    let trialCaryUsers = 0;
    let totalAuthEvents = 0;
    for (const [uid, n] of Object.entries(eventsByUser)) {
      totalAuthEvents += n;
      const tier = userTierMap[uid];
      if (tier === 'premium') premiumCaryUsers++;
      else if (tier === 'trial') trialCaryUsers++;
    }
    const distinctAuthCaryUsers = premiumCaryUsers + trialCaryUsers;

    // % adozione Cary per modalita'
    const caryUsagePremiumPct = premiumUsers > 0 ? Math.round((premiumCaryUsers / premiumUsers) * 100) : 0;
    const caryUsageTrialPct = trialUsers > 0 ? Math.round((trialCaryUsers / trialUsers) * 100) : 0;
    const demoCaryUsers = demoCaryVisitorIds.size;
    const caryUsageDemoPct = demoUsers > 0 ? Math.round((demoCaryUsers / demoUsers) * 100) : 0;

    const totalUsers = premiumUsers + trialUsers + demoUsers;
    const totalCaryUsers = premiumCaryUsers + trialCaryUsers + demoCaryUsers;
    const caryAdoptionPct = totalUsers > 0 ? Math.round((totalCaryUsers / totalUsers) * 100) : 0;

    // Messaggi medi per utente Cary attivo (da tracking, fallback default)
    const avgMsgsPerCaryUser: number = typeof body.avgMsgsPerCaryUser === 'number'
      ? body.avgMsgsPerCaryUser
      : (distinctAuthCaryUsers > 0
        ? Math.max(1, Math.round(totalAuthEvents / distinctAuthCaryUsers))
        : DEFAULT_AVG_MSGS_PER_CARY_USER);

    // Proiezione business
    const proj = computeProjection({
      plan,
      premiumUsers,
      trialUsers,
      demoUsers,
      caryAdoption: { premium: caryUsagePremiumPct, trial: caryUsageTrialPct, demo: caryUsageDemoPct },
      avgMsgsPerCaryUser,
      premiumPrice,
    });

    const snapshotDate = new Date().toISOString().slice(0, 10);
    const metrics = {
      snapshot_date: snapshotDate,
      premium_users: premiumUsers,
      trial_users: trialUsers,
      demo_users: demoUsers,
      cary_usage_premium_pct: caryUsagePremiumPct,
      cary_usage_trial_pct: caryUsageTrialPct,
      cary_usage_demo_pct: caryUsageDemoPct,
      cary_adoption_pct: caryAdoptionPct,
      avg_msgs_per_cary_user: avgMsgsPerCaryUser,
      total_msg_credits_used: proj.msgCreditsUsed,
      total_integration_credits_used: proj.integrationCreditsUsed,
      base44_plan: plan.id,
      base44_plan_cost: plan.cost,
      msg_credits_included: plan.msgCredits,
      integration_credits_included: plan.integrationCredits,
      premium_price: premiumPrice,
      estimated_monthly_revenue: proj.revenue,
      estimated_monthly_cost: proj.cost,
      estimated_margin: proj.margin,
      break_even_users: proj.breakEvenUsers,
      // dettaglio extra per la UI (non salvati nell'entity)
      premium_cary_users: premiumCaryUsers,
      trial_cary_users: trialCaryUsers,
      demo_cary_users: demoCaryUsers,
      msg_credits_used: proj.msgCreditsUsed,
      integration_credits_used: proj.integrationCreditsUsed,
      msg_credits_pct: proj.msgCreditsPct,
      integration_credits_pct: proj.integrationCreditsPct,
      margin_pct: proj.marginPct,
      verdict: proj.verdict,
    };

    if (mode === 'save') {
      const record = await base44.asServiceRole.entities.BusinessSnapshot.create({
        snapshot_date: snapshotDate,
        source,
        premium_users: premiumUsers,
        trial_users: trialUsers,
        demo_users: demoUsers,
        cary_usage_premium_pct: caryUsagePremiumPct,
        cary_usage_trial_pct: caryUsageTrialPct,
        cary_usage_demo_pct: caryUsageDemoPct,
        cary_adoption_pct: caryAdoptionPct,
        avg_msgs_per_cary_user: avgMsgsPerCaryUser,
        total_msg_credits_used: proj.msgCreditsUsed,
        total_integration_credits_used: proj.integrationCreditsUsed,
        base44_plan: plan.id,
        base44_plan_cost: plan.cost,
        msg_credits_included: plan.msgCredits,
        integration_credits_included: plan.integrationCredits,
        premium_price: premiumPrice,
        estimated_monthly_revenue: proj.revenue,
        estimated_monthly_cost: proj.cost,
        estimated_margin: proj.margin,
        break_even_users: proj.breakEvenUsers,
      });
      return Response.json({ ...metrics, saved: true, snapshot_id: record.id });
    }

    return Response.json({ ...metrics, saved: false });
  } catch (error) {
    console.error('snapshotBusinessMetrics', error);
    return Response.json({ error: String((error && error.message) || error) }, { status: 500 });
  }
}