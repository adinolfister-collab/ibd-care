import React, { useState, useMemo, useEffect } from 'react';
import { Mail, Send, CheckCircle2, XCircle, Crown, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const DEFAULT_SUBJECT = 'Diventa Founder di IBD Care — Premium gratuito a vita, senza pagare l\'abbonamento';
const DEFAULT_BODY = `Siamo lieti di invitarla a unirsi ai Founder di IBD Care: un gruppo esclusivo riservato ai primi utenti che hanno creduto nel progetto fin dall'inizio.

Come Founder riceverà l'abbonamento Premium gratuito a vita — niente canone mensile, niente rinnovo annuale — come premio per essere tra i primi a sostenere la community. I posti sono limitati e assegnati in ordine di adesione.

Per aderire apra l'app, visiti la pagina «Founder» e confermi la propria adesione: il riconoscimento verrà applicato automaticamente al suo account.

👉 Apri IBD Care — Founder: https://ibd-care.it/founders

Un piccolo favore in cambio: ci aiuti a far crescere IBD Care lasciando una recensione positiva e condividendo il suo feedback. Ogni voce conta per chi vive ogni giorno con la malattia.

Grazie di cuore,
Il team di IBD Care`;

export default function FounderInvitations() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [founderIds, setFounderIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, ranking] = await Promise.all([
        base44.entities.User.list('-created_date', 200),
        base44.functions.invoke('getFoundersRanking', {}).then((r) => r.data).catch(() => null),
      ]);
      setUsers(u);
      const confirmed = new Set(
        (ranking?.confirmed || ranking?.rankings || [])
          .filter((x) => x.confirmed !== false)
          .map((x) => x.user_id || x.id)
          .filter(Boolean)
      );
      setFounderIds(confirmed);
      // Pre-select all users that are not confirmed founders and are verified
      const preSel = new Set(
        u
          .filter((u) => !confirmed.has(u.id) && u.is_verified !== false)
          .map((u) => u.id)
      );
      setSelected(preSel);
    } catch (e) {
      toast({ title: 'Errore caricamento utenti', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(users.filter((u) => !founderIds.has(u.id)).map((u) => u.id)));
  };
  const deselectAll = () => setSelected(new Set());

  const recipients = useMemo(
    () => users.filter((u) => selected.has(u.id)),
    [users, selected]
  );

  const send = async () => {
    if (!recipients.length) {
      toast({ title: 'Seleziona almeno un destinatario' });
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast({ title: 'Oggetto e corpo sono obbligatori' });
      return;
    }
    setSending(true);
    setResults(null);
    try {
      const payload = {
        subject,
        text: body,
        recipients: recipients.map((u) => ({ email: u.email, name: u.full_name })),
      };
      const res = await base44.functions.invoke('sendFoundersInvitations', payload);
      setResults(res.data);
      toast({
        title: `Inviti inviati: ${res.data.sent}`,
        description: res.data.failed ? `${res.data.failed} falliti` : undefined,
        variant: res.data.failed ? 'destructive' : 'default',
      });
    } catch (e) {
      toast({ title: 'Errore invio', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recipient selection */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Destinatari
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </Button>
              <Button variant="outline" size="sm" onClick={selectAll}>Tutti</Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>Nessuno</Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {recipients.length} selezionati · {users.length} utenti totali · i Founder confermati sono esclusi dalla selezione rapida.
          </p>

          <div className="rounded-xl border border-border max-h-80 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Caricamento…</div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Nessun utente.</div>
            ) : (
              users.map((u) => {
                const isFounder = founderIds.has(u.id);
                const checked = selected.has(u.id);
                return (
                  <label
                    key={u.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors',
                      isFounder && 'opacity-60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isFounder}
                      onChange={() => toggle(u.id)}
                      className="w-4 h-4 rounded border-input accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {u.full_name || u.email}
                        {isFounder && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wide text-terracotta">
                            <Crown className="w-3 h-3" /> Founder
                          </span>
                        )}
                      </p>
                      {u.full_name && <p className="text-xs text-muted-foreground truncate">{u.email}</p>}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compose + results */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Send className="w-4 h-4 text-terracotta" /> Composizione invito
          </h2>

          <div>
            <Label htmlFor="fi-subject">Oggetto</Label>
            <Input
              id="fi-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="fi-body">Corpo dell'email</Label>
            <Textarea
              id="fi-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="mt-1"
            />
          </div>

          <div className="rounded-xl border border-dashed border-border p-4 bg-muted/30">
            <p className="text-[0.65rem] font-heading font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">Anteprima</p>
            <p className="text-sm font-medium mb-1">{subject}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {recipients[0] ? `Gentile ${recipients[0].full_name || 'utente'},` : 'Gentile utente,'}
              {'\n\n'}{body}
            </p>
          </div>

          <Button
            onClick={send}
            disabled={sending || !recipients.length || !subject.trim() || !body.trim()}
            className="w-full rounded-xl"
            size="lg"
          >
            {sending ? (
              <><span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> Invio in corso…</>
            ) : (
              <><Send className="w-4 h-4" /> Invia a {recipients.length} destinatari</>
            )}
          </Button>

          {results && (
            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="text-sm font-medium">
                Inviati: {results.sent} · Falliti: {results.failed}
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {results.results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {r.status === 'ok' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-destructive" />
                    )}
                    <span className="truncate flex-1">{r.email}</span>
                    {r.error && <span className="text-muted-foreground truncate">{r.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}