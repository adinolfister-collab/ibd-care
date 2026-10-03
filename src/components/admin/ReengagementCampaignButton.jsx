import React, { useEffect, useState, useCallback } from 'react';
import { Send, Loader2, Mail, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

// Pulsante admin per la campagna one-shot di re-engagement: invia la mail di
// guida pratica (dormantEmail) a tutti gli utenti dormienti "mai ricordati"
// (storici inclusi). Mostra un conteggio live (preview backend), un dialog di
// conferma e un toast di riepilogo. Riusabile in AdminConversions e AdminSupport.
export default function ReengagementCampaignButton({ onDone }) {
  const { toast } = useToast();
  const [count, setCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(true);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const loadCount = useCallback(async () => {
    setLoadingCount(true);
    try {
      const res = await base44.functions.invoke('sendDormantReminders', {
        mode: 'campaign',
        preview: true,
      });
      setCount(res?.data?.dormant_count ?? 0);
    } catch {
      setCount(null);
    } finally {
      setLoadingCount(false);
    }
  }, []);

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  const handleRun = async () => {
    setOpen(false);
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendDormantReminders', {
        mode: 'campaign',
      });
      const sent = res?.data?.sent ?? 0;
      const failed = res?.data?.failed ?? 0;
      toast({
        title: 'Campagna inviata',
        description: `${sent} email inviate${failed ? `, ${failed} non recapitate` : ''}.`,
      });
      await loadCount();
      onDone?.();
    } catch (e) {
      toast({ title: 'Invio fallito', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const noTargets = !loadingCount && count === 0;

  return (
    <Card className="mt-6">
      <CardContent className="pt-5">
        <h2 className="font-heading text-lg font-semibold mb-1 flex items-center gap-2">
          <Mail className="w-4 h-4 text-terracotta" />
          Campagna re-engagement
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Invia la mail di guida pratica a tutti gli utenti registrati senza inserimenti
          che non sono ancora stati contattati, inclusi gli storici pre-workflow.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-lg bg-terracotta/10 border border-terracotta/30 px-3 py-2">
            <Users className="w-4 h-4 text-terracotta" />
            <span className="text-sm font-medium text-foreground">
              {loadingCount ? 'Conteggio…' : `${count ?? 0} dormienti`}
            </span>
          </div>

          <Button
            onClick={() => setOpen(true)}
            disabled={loadingCount || sending || noTargets}
            className="bg-terracotta hover:bg-terracotta/90 text-terracotta-foreground rounded-xl"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Invio…
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" /> Avvia campagna
              </>
            )}
          </Button>

          {noTargets && (
            <span className="text-xs text-muted-foreground">
              Nessun utente dormiente da contattare.
            </span>
          )}
        </div>
      </CardContent>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avviare la campagna re-engagement?</AlertDialogTitle>
            <AlertDialogDescription>
              Verrà inviata la mail di guida pratica a {count ?? 0} utenti senza
              inserimenti. L'operazione non è reversibile. Gli utenti già
              contattati saranno esclusi automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRun}
              disabled={sending}
              className="bg-terracotta hover:bg-terracotta/90 text-terracotta-foreground"
            >
              Conferma e invia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}