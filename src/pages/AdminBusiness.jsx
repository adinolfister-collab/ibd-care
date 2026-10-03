import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Sparkles, DollarSign, Sliders, RefreshCw, Table2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { BASE44_PLANS, DEFAULT_PLAN_ID, DEFAULT_PREMIUM_PRICE, DEFAULT_AVG_MSGS_PER_CARY_USER, getPlan, computeProjection } from '@/lib/businessPlans';
import BusinessVerdictCard from '@/components/admin/BusinessVerdictCard';
import BusinessPlanSelector from '@/components/admin/BusinessPlanSelector';
import BusinessTrendCharts from '@/components/admin/BusinessTrendCharts';
import BusinessSnapshotArchive from '@/components/admin/BusinessSnapshotArchive';
import BusinessCaryAdoption from '@/components/admin/BusinessCaryAdoption';

const PRICE_PRESETS = [0.99, 1.99, 4.99, 9.99];

export default function AdminBusiness() {
  const { user } = useAuth();
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState('90');

  // Sim state
  const [planId, setPlanId] = useState(DEFAULT_PLAN_ID);
  const [customPlan, setCustomPlan] = useState({ cost: 160, msgCredits: 1628, integrationCredits: 72678 });
  const [premiumPrice, setPremiumPrice] = useState(DEFAULT_PREMIUM_PRICE);
  const [simPremiumUsers, setSimPremiumUsers] = useState(null);
  const [simTrialUsers, setSimTrialUsers] = useState(null);
  const [avgMsgsOverride, setAvgMsgsOverride] = useState(null);
  const [windowDays, setWindowDays] = useState(30);
  const [simCary, setSimCary] = useState({ premium: null, trial: null, demo: null });

  const loadLive = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('snapshotBusinessMetrics', { mode: 'preview', windowDays });
      setLive(res.data);
    } catch (e) {
      setLive(null);
    } finally {
      setLoading(false);
    }
  }, [windowDays]);

  const loadSnapshots = useCallback(async () => {
    try {
      const res = await base44.entities.BusinessSnapshot.list('-snapshot_date', 200);
      setSnapshots(res.data || []);
    } catch (e) {
      setSnapshots([]);
    }
  }, []);

  useEffect(() => {
    loadLive();
    loadSnapshots();
  }, [loadLive, loadSnapshots]);

  const livePremium = live?.premium_users || 0;
  const liveTrial = live?.trial_users || 0;
  const liveDemo = live?.demo_users || 0;
  const liveCary = {
    premium: live?.cary_usage_premium_pct || 0,
    trial: live?.cary_usage_trial_pct || 0,
    demo: live?.cary_usage_demo_pct || 0,
  };
  const effectiveCary = {
    premium: simCary.premium ?? liveCary.premium,
    trial: simCary.trial ?? liveCary.trial,
    demo: simCary.demo ?? liveCary.demo,
  };
  const avgMsgs = avgMsgsOverride ?? live?.avg_msgs_per_cary_user ?? DEFAULT_AVG_MSGS_PER_CARY_USER;
  const premiumUsers = simPremiumUsers ?? livePremium;
  const trialUsers = simTrialUsers ?? liveTrial;

  const selectedBase = getPlan(planId);
  const effectivePlan = planId === 'elite_custom'
    ? { ...selectedBase, ...customPlan }
    : selectedBase;

  const proj = useMemo(() => computeProjection({
    plan: effectivePlan,
    premiumUsers,
    trialUsers,
    demoUsers: liveDemo,
    caryAdoption: effectiveCary,
    avgMsgsPerCaryUser: avgMsgs,
    premiumPrice,
  }), [effectivePlan, premiumUsers, trialUsers, liveDemo, avgMsgs, premiumPrice, effectiveCary.premium, effectiveCary.trial, effectiveCary.demo]);

  const comparison = useMemo(() => BASE44_PLANS.map((p) => {
    const plan = p.id === 'elite_custom' ? { ...p, ...customPlan } : p;
    const r = computeProjection({
      plan, premiumUsers, trialUsers, demoUsers: liveDemo,
      caryAdoption: effectiveCary, avgMsgsPerCaryUser: avgMsgs, premiumPrice,
    });
    return { plan, result: r };
  }), [premiumUsers, trialUsers, liveDemo, avgMsgs, premiumPrice, customPlan, effectiveCary.premium, effectiveCary.trial, effectiveCary.demo]);

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;
  if (!user) return null;

  const handleSaveSnapshot = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('snapshotBusinessMetrics', {
        mode: 'save', source: 'manual',
        base44PlanId: planId,
        base44PlanCost: effectivePlan.cost,
        msgCreditsIncluded: effectivePlan.msgCredits,
        integrationCreditsIncluded: effectivePlan.integrationCredits,
        premiumPrice,
        avgMsgsPerCaryUser: avgMsgs,
        windowDays,
      });
      await loadSnapshots();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSnapshot = async (id) => {
    try {
      await base44.entities.BusinessSnapshot.delete(id);
      setSnapshots((prev) => prev.filter((s) => s.id !== id));
    } catch (e) { /* ignore */ }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Business Dashboard"
        subtitle="Costi-benefici di IBD Care: utenti, adozione Cary per modalità, crediti Base44 e margini a confronto."
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-card border border-border rounded-full p-0.5">
              {[{ d: 0, l: 'Oggi' }, { d: 7, l: '7gg' }, { d: 30, l: '30gg' }, { d: 90, l: '90gg' }].map((opt) => (
                <button
                  key={opt.d}
                  onClick={() => setWindowDays(opt.d)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    windowDays === opt.d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt.l}
                </button>
              ))}
            </div>
            <button onClick={loadLive} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              Aggiorna
            </button>
          </div>
        }
      />

      {/* KPI live */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="Utenti Premium" value={loading ? '—' : livePremium} sub="abbonamento attivo" />
        <StatCard icon={Users} label="Utenti Trial" value={loading ? '—' : liveTrial} sub="prova gratuita in corso" />
        <StatCard icon={Sparkles} label="Adozione Cary" value={loading ? '—' : `${live?.cary_adoption_pct || 0}%`} sub={`${(live?.premium_cary_users || 0) + (live?.trial_cary_users || 0) + (live?.demo_cary_users || 0)} utenti Cary`} />
        <StatCard icon={DollarSign} label="Prezzo Premium" value={`$${premiumPrice.toFixed(2)}`} sub="simulato" />
      </div>

      {/* Cary adoption: numeri assoluti + slider simulazione */}
      <div className="mb-6">
        <BusinessCaryAdoption
          live={live}
          sim={simCary}
          onSimChange={(key, val) => setSimCary((prev) => ({ ...prev, [key]: val }))}
          onReset={(key) => setSimCary((prev) => ({ ...prev, [key]: null }))}
          windowDays={windowDays}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BusinessVerdictCard proj={proj} plan={effectivePlan} premiumPrice={premiumPrice} premiumUsers={premiumUsers} />

        {/* Sim controls */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-terracotta" />
              Simulatore what-if
            </h2>

            <Label className="text-xs">Prezzo Premium ($/mese)</Label>
            <div className="flex gap-1.5 mt-1.5 mb-4 flex-wrap">
              {PRICE_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPremiumPrice(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border transition-colors',
                    premiumPrice === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'
                  )}
                >
                  ${p.toFixed(2)}
                </button>
              ))}
              <Input
                type="number" step="0.01" min="0"
                value={premiumPrice}
                onChange={(e) => setPremiumPrice(Number(e.target.value) || 0)}
                className="w-24 h-8"
              />
            </div>

            <Label className="text-xs">Utenti Premium simulati</Label>
            <div className="flex items-center gap-3 mt-1.5 mb-4">
              <input
                type="range" min="0" max="10000" step="1"
                value={premiumUsers}
                onChange={(e) => setSimPremiumUsers(Number(e.target.value))}
                className="flex-1 accent-terracotta"
              />
              <Input
                type="number" min="0" max="10000" step="1"
                value={premiumUsers}
                onChange={(e) => setSimPremiumUsers(Number(e.target.value) || 0)}
                className="w-20 h-8"
              />
              {simPremiumUsers !== null && (
                <button onClick={() => setSimPremiumUsers(null)} className="text-xs text-terracotta underline">reset</button>
              )}
            </div>

            <Label className="text-xs">Utenti Trial simulati</Label>
            <div className="flex items-center gap-3 mt-1.5 mb-4">
              <input
                type="range" min="0" max="10000" step="1"
                value={trialUsers}
                onChange={(e) => setSimTrialUsers(Number(e.target.value))}
                className="flex-1 accent-terracotta"
              />
              <Input
                type="number" min="0" max="10000" step="1"
                value={trialUsers}
                onChange={(e) => setSimTrialUsers(Number(e.target.value) || 0)}
                className="w-20 h-8"
              />
              {simTrialUsers !== null && (
                <button onClick={() => setSimTrialUsers(null)} className="text-xs text-terracotta underline">reset</button>
              )}
            </div>

            <Label className="text-xs">Messaggi Cary medi per utente /mese (stimato: {live?.avg_msgs_per_cary_user ?? '—'})</Label>
            <Input
              type="number" min="1" step="1"
              value={avgMsgs}
              onChange={(e) => setAvgMsgsOverride(Number(e.target.value) || 1)}
              className="mt-1.5 h-9"
            />
            <p className="text-[0.65rem] text-muted-foreground mt-1.5">
              I crediti sono stimati dall'uso reale di Cary (premium+trial). La modalità demo non consuma crediti (risposte simulate lato client).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan selector */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5">
          <h2 className="font-heading text-lg font-semibold mb-1">Piano Base44</h2>
          <p className="text-xs text-muted-foreground mb-4">Seleziona un piano per confrontare break-even e margini. "Elite personalizzato" è il piano attuale dell'app.</p>
          <BusinessPlanSelector
            plans={BASE44_PLANS}
            selectedId={planId}
            onSelect={setPlanId}
            customPlan={customPlan}
            onCustomChange={setCustomPlan}
          />
        </CardContent>
      </Card>

      {/* Comparative table */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5">
          <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
            <Table2 className="w-4 h-4 text-terracotta" />
            Comparativa piani
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 px-2 font-medium">Piano</th>
                  <th className="py-2 px-2 font-medium text-right">Costo/mo</th>
                  <th className="py-2 px-2 font-medium text-right">Crediti msg</th>
                  <th className="py-2 px-2 font-medium text-right">Crediti integ.</th>
                  <th className="py-2 px-2 font-medium text-right">Break-even</th>
                  <th className="py-2 px-2 font-medium text-right">Margine/mo</th>
                  <th className="py-2 px-2 font-medium text-center">Verdetto</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(({ plan, result }) => {
                  const active = plan.id === planId;
                  const vmap = { profit: 'text-emerald-600', warning: 'text-amber-600', loss: 'text-rose-600' };
                  const vlabel = { profit: 'Utile', warning: 'Attenzione', loss: 'Perdita' };
                  return (
                    <tr key={plan.id} className={cn('border-b border-border last:border-0', active && 'bg-primary/5')}>
                      <td className="py-2.5 px-2 font-medium">{plan.name}{active && <span className="ml-1.5 text-[0.6rem] text-terracotta">●</span>}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">${plan.cost}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{plan.msgCredits.toLocaleString('it-IT')}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums">{plan.integrationCredits.toLocaleString('it-IT')}</td>
                      <td className="py-2.5 px-2 text-right tabular-nums font-medium">{result.breakEvenUsers ?? '—'}</td>
                      <td className={cn('py-2.5 px-2 text-right tabular-nums font-medium', result.margin >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                        {result.margin >= 0 ? '+' : ''}${result.margin.toFixed(2)}
                      </td>
                      <td className={cn('py-2.5 px-2 text-center text-xs font-medium', vmap[result.verdict])}>{vlabel[result.verdict]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[0.65rem] text-muted-foreground mt-3">
            Calcoli su {premiumUsers} premium · {trialUsers} trial · {liveDemo} demo · {avgMsgs} msg Cary/utente · ${premiumPrice.toFixed(2)}/premium.
          </p>
        </CardContent>
      </Card>

      {/* Trend charts */}
      <div className="mb-6">
        <BusinessTrendCharts snapshots={snapshots} range={range} onRangeChange={setRange} />
      </div>

      {/* Archive */}
      <BusinessSnapshotArchive
        snapshots={snapshots}
        onSaveSnapshot={handleSaveSnapshot}
        saving={saving}
        onDelete={handleDeleteSnapshot}
      />
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-8 h-8 rounded-lg bg-terracotta/15 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-terracotta" />
          </span>
          <p className="text-xs text-muted-foreground leading-tight">{label}</p>
        </div>
        <p className="text-2xl font-heading font-semibold">{value}</p>
        {sub && <p className="text-[0.65rem] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}