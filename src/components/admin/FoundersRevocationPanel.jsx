import React, { useEffect, useState } from 'react';
import { Crown, RefreshCw, Trash2, AlertTriangle, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LIFETIME_SLOTS = 10;

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function FoundersRevocationPanel() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [founders, setFounders] = useState([]);
  const [diaryCounts, setDiaryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [signupRes, trialRes] = await Promise.all([
        base44.entities.CampaignSignup.filter(
          { campaign: 'founders', confirmed: true }, 'rank', 100,
        ),
        base44.functions.invoke('getTrialUsers', {}),
      ]);
      const signups = (signupRes || []).filter((s) => s.confirmed);
      // Map diary counts by user id from the trial users payload.
      const counts = {};
      for (const u of trialRes?.data?.users || []) {
        counts[u.id] = {
          diaryTotal: u.diaryTotal || 0,
          symptoms: u.symptoms || 0,
          foods: u.foods || 0,
          meds: u.meds || 0,
          records: u.records || 0,
          lastActivity: u.lastActivity,
        };
      }
      setFounders(signups);
      setDiaryCounts(counts);
    } catch (e) {
      // keep last state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    loadData();
  }, [currentUser]);

  const handleRevoke = async () => {
    if (!confirmTarget) return;
    setRevoking(confirmTarget.user_id);
    try {
      const res = await base44.functions.invoke('revokeFoundersSignup', {
        user_id: confirmTarget.user_id,
      });
      if (res?.data?.success) {
        toast({
          title: 'Founder revocato',
          description: `${confirmTarget.name} ha perso il posto. Rank ricalcolati, slot liberato.`,
        });
        setConfirmTarget(null);
        await loadData();
      } else {
        toast({
          title: 'Errore',
          description: res?.data?.error || 'Impossibile revocare il Founder',
          variant: 'destructive',
        });
      }
    } catch (e) {
      toast({
        title: 'Errore',
        description: String(e?.message || e),
        variant: 'destructive',
      });
    } finally {
      setRevoking(null);
    }
  };

  const occupied = founders.length;
  const free = LIFETIME_SLOTS - occupied;

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Crown className="w-4 h-4 text-terracotta" />
            Founder — revoca slot
          </h2>
          <button
            onClick={loadData}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Aggiorna"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {occupied} su {LIFETIME_SLOTS} slot occupati · {free} liberi. Revoca un Founder inattivo per liberare lo slot: il Premium a vita viene rimosso e i rank dei successivi scalano automaticamente.
        </p>

        {loading ? (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">Caricamento Founder…</div>
        ) : founders.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Nessun Founder confermato.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Rank</th>
                  <th className="py-2 px-3 font-medium">Utente</th>
                  <th className="py-2 px-3 font-medium">Iscritto</th>
                  <th className="py-2 px-3 font-medium text-center">Inserimenti diario</th>
                  <th className="py-2 px-3 font-medium">Ultima attività</th>
                  <th className="py-2 pl-3 font-medium text-right">Azione</th>
                </tr>
              </thead>
              <tbody>
                {founders.map((f) => {
                  const uid = String(f.created_by_id);
                  const counts = diaryCounts[uid] || {};
                  const diaryTotal = counts.diaryTotal ?? 0;
                  const isSelf = uid === currentUser?.id;
                  const inactive = !isSelf && diaryTotal === 0;
                  return (
                    <tr
                      key={f.id}
                      className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                          <Crown className="w-3.5 h-3.5" />#{f.rank}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-medium truncate max-w-[180px]">{f.display_name || '—'}</p>
                        {isSelf && (
                          <p className="text-xs text-muted-foreground">(tu)</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        {fmtDate(f.first_message_date || f.created_date)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded-full',
                          diaryTotal === 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800',
                        )}>
                          {diaryTotal}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                        {fmtDate(counts.lastActivity)}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSelf || revoking === uid}
                          onClick={() =>
                            setConfirmTarget({
                              user_id: uid,
                              name: f.display_name || 'questo utente',
                              rank: f.rank,
                              diaryTotal,
                            })
                          }
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40"
                        >
                          {revoking === uid ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Revoca
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmation dialog */}
        {confirmTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => !revoking && setConfirmTarget(null)}
          >
            <div
              className="bg-card rounded-2xl border border-border shadow-xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-semibold">Revoca Founder</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Stai per revocare <strong>{confirmTarget.name}</strong> (rank #{confirmTarget.rank}).
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 mb-4 text-sm text-rose-800">
                Il Premium a vita verrà rimosso, lo slot liberato e i Founder successivi scaleranno di rank.
                {confirmTarget.diaryTotal === 0 && (
                  <p className="mt-1 font-medium">Questo utente ha 0 inserimenti nel diario.</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmTarget(null)}
                  disabled={!!revoking}
                >
                  Annulla
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRevoke}
                  disabled={!!revoking}
                >
                  {revoking ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Revoco…
                    </>
                  ) : (
                    'Conferma revoca'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}