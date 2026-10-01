import React, { useEffect, useState } from 'react';
import { Mail, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Pannello admin "Promemoria inserimenti": mostra l'elenco delle mail di
// guida pratica inviate automaticamente ai nuovi utenti inattivi a 48h.
// Notifica passiva — l'admin non deve intervenire manualmente.
export default function DormantRemindersPanel() {
  const [reminders, setReminders] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    base44.entities.DormantReminder
      .list('-sent_at', 100)
      .then((rows) => setReminders(rows))
      .catch(() => setReminders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const sentCount = (reminders || []).filter((r) => r.status === 'sent').length;
  const failedCount = (reminders || []).filter((r) => r.status === 'failed').length;

  return (
    <Card className="mt-6">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-terracotta" />
            Promemoria inserimenti 48h
          </h2>
          <button
            onClick={load}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Aggiorna"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Mail di guida pratica inviate automaticamente ai nuovi utenti senza inserimenti a 48h dalla registrazione.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-50 border border-emerald-200 dark:border-emerald-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="text-xs text-emerald-700 font-medium">Inviate</span>
            </div>
            <p className="text-2xl font-heading font-semibold text-emerald-700 mt-1">{sentCount}</p>
          </div>
          <div className="rounded-lg bg-rose-50 dark:bg-rose-50 border border-rose-200 dark:border-rose-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-700" />
              <span className="text-xs text-rose-700 font-medium">Non recapitate</span>
            </div>
            <p className="text-2xl font-heading font-semibold text-rose-700 mt-1">{failedCount}</p>
          </div>
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Caricamento…</div>
        ) : !reminders || reminders.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Nessun promemoria inviato finora.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Email</th>
                  <th className="py-2 font-medium">Data invio</th>
                  <th className="py-2 font-medium">Stato</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-medium truncate max-w-[200px]">{r.user_email}</td>
                    <td className="py-2.5 text-muted-foreground tabular-nums">
                      {r.sent_at ? new Date(r.sent_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="py-2.5">
                      {r.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Inviata
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-700 text-xs font-medium" title={r.error || ''}>
                          <XCircle className="w-3.5 h-3.5" /> Errore
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}