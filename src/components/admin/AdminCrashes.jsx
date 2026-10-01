import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Sezione crash per la dashboard admin: elenca i crash recenti registrati
// dall'Error Boundary globale, con badge gravita', contatore occorrenze ed
// espansione dello stack. Permette di marcarli come risolti.

const DEVICE_LABELS = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' };

const PAGE_LABELS = {
  '/': 'Home',
  '/login': 'Login',
  '/register': 'Registrati',
  '/forgot-password': 'Password dimenticata',
  '/reset-password': 'Reset password',
  '/abbonamento': 'Abbonamento',
  '/symptoms': 'Sintomi',
  '/food': 'Diario alimentare',
  '/meds': 'Farmaci',
  '/records': 'Cartelle cliniche',
  '/esami': 'Esami',
  '/trends': 'Andamenti',
  '/assistant': 'Assistente Cary',
  '/community': 'Community',
  '/map': 'Mappa servizi',
  '/summary': 'Riepilogo',
  '/shop': 'Negozio',
  '/account': 'Account',
};

function pageLabel(path) {
  if (!path) return '—';
  return PAGE_LABELS[path] || path;
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ora';
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h fa`;
  const d = Math.floor(h / 24);
  return `${d} g fa`;
}

const FILTERS = [
  { value: 'all', label: 'Tutti' },
  { value: 'critical', label: 'Critici' },
  { value: 'normal', label: 'Altri' },
];

export default function AdminCrashes() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [diagnoses, setDiagnoses] = useState({}); // { [id]: { cause, file, suggestion } | 'loading' | { error } }
  const [analyzing, setAnalyzing] = useState(false);

  const load = () => {
    setLoading(true);
    base44.functions
      .invoke('manageAppCrashes', { action: 'list', severity: filter })
      .then((res) => setItems(res.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const resolve = async (id) => {
    try {
      await base44.functions.invoke('manageAppCrashes', { action: 'resolve', id });
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, resolved: true } : c)));
    } catch {}
  };

  const unresolved = items.filter((c) => !c.resolved).length;

  const analyzeAll = async () => {
    const targets = items.filter((c) => !c.resolved && !diagnoses[c.id]);
    if (targets.length === 0) return;
    setAnalyzing(true);
    const loadingMap = {};
    targets.forEach((c) => { loadingMap[c.id] = 'loading'; });
    setDiagnoses((prev) => ({ ...prev, ...loadingMap }));
    try {
      const res = await base44.functions.invoke('analyzeAppCrashes', {
        crashes: targets.map((c) => ({
          id: c.id, path: c.path, severity: c.severity, message: c.message, stack: c.stack,
        })),
      });
      const list = res.data?.diagnoses || [];
      const next = {};
      list.forEach((d) => { next[d.id] = d; });
      // segnala quelli senza diagnosi
      targets.forEach((c) => { if (!next[c.id]) next[c.id] = { error: 'nessuna diagnosi' }; });
      setDiagnoses((prev) => ({ ...prev, ...next }));
    } catch (e) {
      const errMap = {};
      targets.forEach((c) => { errMap[c.id] = { error: 'errore analisi' }; });
      setDiagnoses((prev) => ({ ...prev, ...errMap }));
    } finally {
      setAnalyzing(false);
    }
  };

  const unresolvedToAnalyze = unresolved - Object.keys(diagnoses).length;

  return (
    <Card className="mt-6">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-terracotta" />
            Crash monitor
            {!loading && unresolved > 0 && (
              <span className="ml-1 text-xs font-medium px-2 py-0.5 rounded-full bg-terracotta/15 text-terracotta">
                {unresolved} non risolti
              </span>
            )}
          </h2>
          <div className="flex gap-2 items-center">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs border transition-colors',
                  filter === f.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:bg-accent'
                )}
              >
                {f.label}
              </button>
            ))}
            {unresolvedToAnalyze > 0 && (
              <button
                onClick={analyzeAll}
                disabled={analyzing}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  'bg-terracotta text-white border-terracotta hover:bg-terracotta/90 disabled:opacity-60'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {analyzing ? 'Analisi…' : `Analizza con AI (${unresolvedToAnalyze})`}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            Caricamento…
          </div>
        ) : items.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
            Nessun crash registrato. 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((c) => {
              const open = expanded === c.id;
              return (
                <div
                  key={c.id}
                  className={cn(
                    'rounded-lg border bg-card',
                    c.resolved ? 'border-border opacity-60' : 'border-terracotta/30'
                  )}
                >
                  <button
                    onClick={() => setExpanded(open ? null : c.id)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    {open ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={cn(
                        'text-[0.65rem] font-semibold px-2 py-0.5 rounded-full shrink-0',
                        c.severity === 'critical'
                          ? 'bg-terracotta text-white'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {c.severity === 'critical' ? 'CRITICA' : 'normale'}
                    </span>
                    <span className="text-sm font-medium truncate flex-1">
                      {pageLabel(c.path)}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                      ×{c.count}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                      {DEVICE_LABELS[c.device] || c.device}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {timeAgo(c.last_seen)}
                    </span>
                    {c.resolved && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                  {open && (
                    <div className="px-3 pb-3 pt-1 space-y-2 text-sm">
                      <div className="text-foreground break-words">
                        <span className="text-muted-foreground">Messaggio: </span>
                        {c.message || '—'}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>Visitatore: {c.visitor_id || '—'}</span>
                        <span>Sessione: {c.session_id || '—'}</span>
                        <span>Utente: {c.user_id || 'anonimo'}</span>
                        <span>Primo: {timeAgo(c.first_seen)}</span>
                      </div>
                      {c.stack && (
                        <pre className="text-[0.7rem] bg-muted rounded-md p-2 overflow-x-auto max-h-48 text-muted-foreground whitespace-pre-wrap break-words">
                          {c.stack}
                        </pre>
                      )}
                      {diagnoses[c.id] === 'loading' && (
                        <div className="flex items-center gap-2 text-xs text-terracotta">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          Analisi AI in corso…
                        </div>
                      )}
                      {diagnoses[c.id] && diagnoses[c.id] !== 'loading' && (
                        <div className="rounded-lg border border-terracotta/30 bg-terracotta/5 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-terracotta">
                            <Sparkles className="w-3.5 h-3.5" />
                            Diagnosi AI
                          </div>
                          {diagnoses[c.id].error ? (
                            <p className="text-xs text-muted-foreground">{diagnoses[c.id].error}</p>
                          ) : (
                            <>
                              <p className="text-xs text-foreground">
                                <span className="font-medium text-muted-foreground">Causa probabile: </span>
                                {diagnoses[c.id].cause}
                              </p>
                              <p className="text-xs text-foreground">
                                <span className="font-medium text-muted-foreground">File: </span>
                                <code className="bg-muted px-1 rounded">{diagnoses[c.id].file}</code>
                              </p>
                              <p className="text-xs text-foreground">
                                <span className="font-medium text-muted-foreground">Correzione: </span>
                                {diagnoses[c.id].suggestion}
                              </p>
                            </>
                          )}
                        </div>
                      )}
                      {!c.resolved && (
                        <button
                          onClick={() => resolve(c.id)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Segna come risolto
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}