import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Plus, Loader2, Send, Clock, CheckCircle2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import ReasonSelector from '@/components/ReasonSelector';
import { DEFAULT_REASON, getReasonTemplate, REASON_BADGE_CLASSES } from '@/lib/supportTemplates';

export default function MyTickets() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', reason: DEFAULT_REASON });
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // RLS limita la lettura ai ticket dell'utente (created_by_id === user.id)
      const list = await base44.entities.SupportTicket.list('-created_date', 50);
      setTickets(list || []);
    } catch (e) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.message.trim() || sending) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendContactMessage', {
        name: '',
        email: '',
        message: form.message.trim(),
        subject: form.subject.trim(),
        reason: form.reason,
      });
      if (res?.data?.error) throw new Error(res.data.error);
      toast({
        title: t('my_tickets.new_success'),
        description: t('my_tickets.new_success_desc'),
      });
      setForm({ subject: '', message: '', reason: DEFAULT_REASON });
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast({
        title: t('my_tickets.new_error'),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading text-lg font-semibold text-foreground">{t('my_tickets.title')}</p>
          <p className="text-xs text-muted-foreground">{t('my_tickets.subtitle')}</p>
        </div>
        <Dialog open={dialogOpen}           onOpenChange={(o) => { setDialogOpen(o); if (!o) setForm({ subject: '', message: '', reason: DEFAULT_REASON }); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> {t('my_tickets.new')}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{t('my_tickets.new')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground mb-1.5">{t('support_reason.label')}</p>
                <ReasonSelector value={form.reason} onChange={(reason) => setForm({ ...form, reason })} />
              </div>
              <div>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={t('my_tickets.subject_placeholder')}
                />
              </div>
              <div>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={t('my_tickets.message_placeholder')}
                  rows={5}
                />
              </div>
              <Button onClick={handleSubmit} disabled={!form.message.trim() || sending} className="w-full rounded-xl">
                {sending ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> {t('support_inbox.sending')}</>
                ) : (
                  <><Send className="w-4 h-4 mr-1.5" /> {t('my_tickets.new_send')}</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">{t('my_tickets.no_tickets')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('my_tickets.no_tickets_desc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((tk) => (
            <Card key={tk.id} className="border shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {tk.reason && (() => {
                      const tmpl = getReasonTemplate(tk.reason);
                      return tmpl ? (
                        <span className={cn('inline-flex items-center text-xs font-medium border rounded-full px-2 py-0.5 mb-1', REASON_BADGE_CLASSES[tmpl.color])}>
                          {t(tmpl.labelKey)}
                        </span>
                      ) : null;
                    })()}
                    {tk.subject && <p className="font-medium text-foreground truncate">{tk.subject}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(tk.created_date).toLocaleDateString('it-IT')}</p>
                  </div>
                  {tk.status === 'open' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                      <Clock className="w-3 h-3" /> {t('my_tickets.status_open')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> {t('my_tickets.status_closed')}
                    </span>
                  )}
                </div>
                <div className="rounded-lg bg-accent/40 p-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{tk.message}</p>
                </div>
                {tk.status === 'closed' && tk.reply && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                      {t('my_tickets.reply_from')}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{tk.reply}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}