import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MousePointerClick, Users, Clock, Globe2, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const RANGES = [
  { value: 'today', label: 'Oggi' },
  { value: '7d', label: '7 giorni' },
  { value: '30d', label: '30 giorni' },
  { value: 'all', label: 'Totale' },
];

const FUNNEL_COLORS = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
];

function formatDuration(sec) {
  if (!sec || sec < 1) return '0s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export default function AdminConversions() {
  const { user } = useAuth();
  const [range, setRange] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.functions
      .invoke('getConversionFunnel', { range })
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;
  if (!user) return null;

  const visite = data?.visite || 0;
  const visitatoriUnici = data?.visitatoriUnici || 0;
  const avgSessionSec = data?.avgSessionSec || 0;
  const funnel = data?.funnel || [];
  const topCountries = data?.topCountries || [];
  const sectionDuration = data?.sectionDuration || [];
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.value));
  const premiumRate =
    visite > 0 && funnel.length
      ? Math.round(((funnel[funnel.length - 1]?.value || 0) / visite) * 100)
      : 0;

  return (
    <AppLayout>
      <PageHeader
        title="Conversioni"
        subtitle="Provenienza visitatori, tempo medio di permanenza e funnel di conversione tra le sezioni dell'app."
      />

      {/* Range filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
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

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={MousePointerClick}
          label="Visite totali"
          value={loading ? '—' : visite}
          sub="sessioni uniche"
        />
        <StatCard
          icon={Users}
          label="Visitatori unici"
          value={loading ? '—' : visitatoriUnici}
          sub="anonimi + loggati"
        />
        <StatCard
          icon={Clock}
          label="Permanenza media"
          value={loading ? '—' : formatDuration(avgSessionSec)}
          sub="per sessione"
        />
        <StatCard
          icon={TrendingDown}
          label="Conversione Premium"
          value={loading ? '—' : `${premiumRate}%`}
          sub="abbonamento / visite"
        />
      </div>

      {/* Funnel */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <h2 className="font-heading text-lg font-semibold mb-4">
            Funnel di conversione
          </h2>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              Caricamento…
            </div>
          ) : (
            <div className="space-y-3">
              {funnel.map((step, i) => {
                const widthPct = Math.max(2, Math.round((step.value / maxFunnel) * 100));
                return (
                  <div key={step.key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{step.label}</span>
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{step.value}</span>
                        {i > 0 && (
                          <span className="ml-2 text-xs">
                            {step.pct}% del precedente
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-8 w-full rounded-lg bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-lg flex items-center justify-end pr-2 text-xs font-medium text-white transition-all',
                          FUNNEL_COLORS[i % FUNNEL_COLORS.length]
                        )}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paesi top */}
        <Card>
          <CardContent className="pt-5">
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-terracotta" />
              Provenienza (paesi top)
            </h2>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                Caricamento…
              </div>
            ) : topCountries.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                Nessun dato di visita.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 font-medium">Paese</th>
                    <th className="py-2 font-medium text-right">Sessioni</th>
                    <th className="py-2 font-medium w-32">Distribuzione</th>
                  </tr>
                </thead>
                <tbody>
                  {topCountries.map((c) => {
                    const pct = visite > 0 ? Math.round((c.sessions / visite) * 100) : 0;
                    return (
                      <tr key={c.country} className="border-b border-border last:border-0">
                        <td className="py-2.5">{c.country}</td>
                        <td className="py-2.5 text-right font-medium">{c.sessions}</td>
                        <td className="py-2.5">
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-terracotta rounded-full"
                              style={{ width: `${Math.max(2, pct)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Permanenza per sezione */}
        <Card>
          <CardContent className="pt-5">
            <h2 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-terracotta" />
              Permanenza per sezione
            </h2>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                Caricamento…
              </div>
            ) : sectionDuration.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                Nessun dato di permanenza.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 font-medium">Sezione</th>
                    <th className="py-2 font-medium text-right">Tempo medio</th>
                    <th className="py-2 font-medium text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionDuration.map((s) => (
                    <tr key={s.section} className="border-b border-border last:border-0">
                      <td className="py-2.5">{s.section}</td>
                      <td className="py-2.5 text-right font-medium">
                        {formatDuration(s.avgSec)}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">{s.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
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