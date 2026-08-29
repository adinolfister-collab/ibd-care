import React, { useState } from 'react';
import { RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// pannello admin per la sincronizzazione programmi MyLead (enrichte menu partner).
export default function MyLeadSyncPanel() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  const run = async () => {
    setLoading(true); setErr(null); setResult(null);
    try {
      const res = await base44.functions.invoke('syncMyLeadPrograms', {});
      const data = res?.data || {};
      setResult(data);
      if (data.ok) {
        toast({
          title: 'Sincronizzazione MyLead completata',
          description: `${data.created} nuovi · ${data.updated} aggiornati · ${data.deactivated} disattivati`,
        });
      } else {
        toast({
          title: 'Sincronizzazione non riuscita',
          description: data.message || data.api_error || 'Verifica MYLEAD_TOKEN',
          variant: 'destructive',
        });
      }
    } catch (e) {
      setErr(e?.message || 'Errore sincronizzazione');
      toast({ title: 'Errore', description: e?.message || 'Sincronizzazione non riuscita', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const missing = result?.missing || [];

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-heading text-lg font-semibold">Sincronizzazione programmi MyLead</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Importa i programmi/offerte MyLead e li mostra come voci del menù "I nostri partner" del Negozio, abbinati per categoria.
                Sincronizzazione automatica ogni notte alle 03:00 (Europe/Rome).
              </p>
            </div>
            <Button onClick={run} disabled={loading} className="rounded-xl">
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
              {loading ? 'Sincronizzazione…' : t('shop.sync_mylead')}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 text-sm">
            <StatusBadge label="MYLEAD_TOKEN" ok={!missing.includes('MYLEAD_TOKEN')} hint="Token API publisher MyLead" />
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Sincronizzazione in corso…
          </CardContent>
        </Card>
      )}

      {err && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-sm text-rose-600">{err}</CardContent>
        </Card>
      )}

      {result && !loading && result.ok && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <p className="flex items-center gap-1.5 font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Ultima sincronizzazione: {new Date(result.synced_at).toLocaleString('it-IT')}
            </p>
            <div className="grid grid-cols-4 gap-3 text-center">
              <Stat n={result.fetched} label="programmi" />
              <Stat n={result.created} label="nuovi" />
              <Stat n={result.updated} label="aggiornati" />
              <Stat n={result.deactivated} label="disattivati" />
            </div>
            {result.skipped > 0 && (
              <p className="text-xs text-muted-foreground">{result.skipped} programmi saltati (nessuna categoria o URL abbinato).</p>
            )}
          </CardContent>
        </Card>
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