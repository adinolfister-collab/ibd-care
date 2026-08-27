import React, { useState } from 'react';
import { RefreshCw, Loader2, CheckCircle2, AlertTriangle, Store, Link as LinkIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Pannello admin per la sincronizzazione offerte Awin.
// Testi in italiano (sezione admin-only). Richiama la funzione syncAwinOffers.
export default function AwinSyncPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  const run = async () => {
    setLoading(true); setErr(null); setResult(null);
    try {
      const res = await base44.functions.invoke('syncAwinOffers', { limit: 20 });
      const data = res?.data || {};
      setResult(data);
      if (data.ok) {
        toast({ title: 'Sincronizzazione Awin completata', description: `${data.advertisers_synced} advertiser · ${data.offers_created} offerte · ${data.products_updated} prodotti` });
      } else {
        toast({ title: 'Configurazione incompleta', description: data.message || 'Verifica le secret Awin', variant: 'destructive' });
      }
    } catch (e) {
      setErr(e?.message || 'Errore sincronizzazione');
      toast({ title: 'Errore', description: e?.message || 'Sincronizzazione non riuscita', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const missing = result?.missing || [];
  const programmes = result?.programmes || [];

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-heading text-lg font-semibold">Sincronizzazione offerte Awin</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Scarica i product feed degli advertiser a cui sei iscritto e aggiorna automaticamente le offerte dei prodotti del catalogo.
                Sincronizzazione automatica ogni notte alle 03:00 (Europe/Rome).
              </p>
            </div>
            <Button onClick={run} disabled={loading} className="rounded-xl">
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
              Sincronizza ora
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <StatusBadge label="AWIN_API_TOKEN" ok={!missing.includes('AWIN_API_TOKEN')} hint="Token Publisher API" />
            <StatusBadge label="AWIN_PUBLISHER_ID" ok={!missing.includes('AWIN_PUBLISHER_ID')} hint="ID account publisher" />
            <StatusBadge label="AWIN_DATAFEED_API_KEY" ok={!missing.includes('AWIN_DATAFEED_API_KEY')} hint="Chiave datafeed (diversa dal token)" />
          </div>

          {missing.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Secret mancanti</p>
              <p className="mt-1 leading-relaxed">
                Imposta in Settings → Secrets: <span className="font-mono">{missing.join(', ')}</span>.
                {missing.includes('AWIN_DATAFEED_API_KEY') && ' La recuperi da Awin → Toolbox → Create-a-Feed (valore dopo /apikey/ nell\'URL del feed).'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Sincronizzazione in corso… il download dei feed può richiedere alcuni minuti.
          </CardContent>
        </Card>
      )}

      {err && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-sm text-rose-600">{err}</CardContent>
        </Card>
      )}

      {result && !loading && (
        <>
          {result.ok ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <p className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> Ultima sincronizzazione: {new Date(result.synced_at).toLocaleString('it-IT')}
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <Stat n={result.advertisers_synced} label="advertiser" />
                  <Stat n={result.offers_created} label="offerte" />
                  <Stat n={result.products_updated} label="prodotti" />
                </div>
                {(result.advertisers || []).length > 0 && (
                  <div className="pt-1">
                    <p className="text-xs font-heading font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">Advertiser sincronizzati</p>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {result.advertisers.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-2 bg-card">
                          <Store className="w-4 h-4 text-terracotta shrink-0" />
                          <span className="flex-1 truncate">{a.name || ('ID ' + a.id)}</span>
                          <span className="text-xs text-muted-foreground">{a.offers} offerte</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(result.errors || []).length > 0 && (
                  <p className="text-xs text-amber-700">{result.errors.length} advertiser con errori (vedi log funzione).</p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {programmes.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-heading font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Programmi joined ({programmes.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto">
                  {programmes.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-2 bg-card">
                      <span className="flex-1 truncate">{p.name || ('ID ' + p.id)}</span>
                      {p.region && <span className="text-xs text-muted-foreground shrink-0">{p.region}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ label, ok, hint }) {
  return (
    <div className={cn('rounded-xl border px-3 py-2 flex items-center gap-2', ok ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-accent')}>
      <span className={cn('w-2 h-2 rounded-full shrink-0', ok ? 'bg-emerald-500' : 'bg-muted-foreground')} />
      <div className="min-w-0">
        <p className="font-mono text-xs truncate">{label}</p>
        <p className="text-[0.65rem] text-muted-foreground truncate">{ok ? 'configurata' : hint || 'mancante'}</p>
      </div>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div className="rounded-xl bg-accent py-3">
      <p className="font-heading text-2xl font-semibold text-primary">{n ?? 0}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}