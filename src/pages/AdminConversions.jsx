import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MousePointerClick, Users, LayoutDashboard } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from 'recharts';

const RANGES = [
  { value: 'today', label: 'Oggi' },
  { value: '7d', label: '7 giorni' },
  { value: '30d', label: '30 giorni' },
  { value: 'all', label: 'Totale' },
];

const FEATURE_LABELS = {
  '/meds': 'Terapie',
  '/records': 'Referti',
  '/esami': 'Esami',
  '/trends': 'Andamento',
  '/symptom-charts': 'Grafici sintomi',
  '/assistant': 'Assistente',
  '/map': 'Mappa',
  '/summary': 'Riepilogo',
  'shop': 'Negozio',
};
const featureLabel = (f) => FEATURE_LABELS[f] || f;

export default function AdminConversions() {
  const { user } = useAuth();
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.functions.invoke('getConversionFunnel', { range })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range]);

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;
  if (!user) return null;

  const totals = data?.totals || [];
  const total = data?.total || 0;
  const uniqueUsers = data?.uniqueUsers || 0;
  const chartData = totals.map((t) => ({ name: featureLabel(t.feature), Tentativi: t.count }));

  return (
    <AppLayout>
      <PageHeader
        title="Conversioni"
        subtitle="Click sui prodotti del negozio e eventi di conversione tracked."
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-sm border transition-colors',
              range === r.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border hover:bg-accent'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard icon={MousePointerClick} label="Click totali" value={loading ? '—' : total} />
        <StatCard icon={Users} label="Utenti unici" value={loading ? '—' : uniqueUsers} />
        <StatCard icon={LayoutDashboard} label="Funzioni" value={loading ? '—' : totals.length} />
      </div>

      <Card className="mb-6">
        <CardContent className="pt-5">
          <h2 className="font-heading text-lg font-semibold mb-3">Click per funzione</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Caricamento…</div>
          ) : totals.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Nessun click registrato.</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Tentativi" fill="hsl(var(--terracotta))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h2 className="font-heading text-lg font-semibold mb-3">Dettaglio</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 font-medium">Funzione</th>
                <th className="py-2 font-medium text-right">Tentativi</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((t) => (
                <tr key={t.feature} className="border-b border-border last:border-0">
                  <td className="py-2.5">{featureLabel(t.feature)}</td>
                  <td className="py-2.5 text-right font-medium">{t.count}</td>
                </tr>
              ))}
              {!loading && totals.length === 0 && (
                <tr><td className="py-4 text-muted-foreground" colSpan={2}>Nessun dato.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <CardContent className="pt-5 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-terracotta/15 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-terracotta" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-heading font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}