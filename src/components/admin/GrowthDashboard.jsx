import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Rocket } from 'lucide-react';
import GrowthKpiCard from '@/components/admin/GrowthKpiCard';
import RetentionCohort from '@/components/admin/RetentionCohort';
import ConversionDrivers from '@/components/admin/ConversionDrivers';
import GrowthAdvisor from '@/components/admin/GrowthAdvisor';

// Cruscotto Crescita: KPI vs target + retention + driver di conversione +
// consigliere AI azionabile. Disposto in cima alla pagina AdminBusiness,
// sopra l'archivio snapshot esistente.
export default function GrowthDashboard() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getGrowthInsights', {});
      setInsights(res.data);
    } catch {
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-5 h-5 text-terracotta" />
        <h2 className="font-heading text-xl font-semibold">Cruscotto crescita</h2>
      </div>
      <GrowthKpiCard kpis={insights?.kpis} loading={loading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RetentionCohort retention={insights?.retention} loading={loading} />
        <ConversionDrivers drivers={insights?.drivers} loading={loading} />
      </div>
      {!loading && <GrowthAdvisor insights={insights} />}
    </section>
  );
}