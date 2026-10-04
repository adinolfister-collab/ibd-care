import React, { useEffect, useState } from 'react';
import { Watch, Check, Loader2, Unlink, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export default function GoogleFitConnectButton() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const checkConnection = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const list = await base44.entities.GoogleFitConnection.list('-created_date', 5);
      setConnected(list.length > 0);
    } catch { setConnected(false); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    checkConnection();
    // Handle OAuth callback: ?code=xxx in URL on /settings
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && isAuthenticated) {
      (async () => {
        setConnecting(true);
        try {
          await base44.functions.invoke('connectGoogleFit', { code });
          toast({ title: t('gfit.connect_success') });
          window.history.replaceState({}, '', window.location.pathname);
          checkConnection();
        } catch (e) {
          toast({ title: t('gfit.connect_error'), description: String(e?.message || e), variant: 'destructive' });
          window.history.replaceState({}, '', window.location.pathname);
        } finally { setConnecting(false); }
      })();
    }
  }, [isAuthenticated]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await base44.functions.invoke('startGoogleFitAuth');
      if (res.data?.auth_url) {
        window.location.href = res.data.auth_url;
      } else {
        throw new Error('No auth URL');
      }
    } catch (e) {
      toast({ title: t('gfit.connect_error'), description: String(e?.message || e), variant: 'destructive' });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const list = await base44.entities.GoogleFitConnection.list('-created_date', 5);
      for (const conn of list) await base44.entities.GoogleFitConnection.delete(conn.id);
      setConnected(false);
      toast({ title: t('gfit.disconnected') || 'Google Fit disconnesso' });
    } catch (e) {
      toast({ title: t('common.error'), description: String(e?.message || e), variant: 'destructive' });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('syncGoogleFitData', { days: 7 });
      toast({ title: t('gfit.sync_done') });
    } catch (e) {
      toast({ title: t('gfit.sync_error'), description: String(e?.message || e), variant: 'destructive' });
    } finally { setSyncing(false); }
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Watch className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="font-semibold">{t('gfit.title')}</p>
              <p className="text-sm text-muted-foreground leading-snug mt-0.5">{t('gfit.login_required')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Watch className="w-5 h-5 text-primary" /></div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{t('gfit.title')}</p>
            <p className="text-sm text-muted-foreground leading-snug mt-0.5">{t('gfit.desc')}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : connected ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> {t('gfit.connected')}
              </span>
              <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm" className="rounded-xl h-9 ml-auto">
                {syncing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                {syncing ? t('gfit.syncing') : t('gfit.sync')}
              </Button>
              <Button onClick={handleDisconnect} variant="ghost" size="sm" className="rounded-xl h-9 text-muted-foreground">
                <Unlink className="w-4 h-4 mr-1.5" /> {t('gfit.disconnect')}
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} disabled={connecting} className="rounded-xl ml-auto">
              {connecting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Watch className="w-4 h-4 mr-1.5" />}
              {connecting ? t('gfit.connecting') : t('gfit.connect')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}