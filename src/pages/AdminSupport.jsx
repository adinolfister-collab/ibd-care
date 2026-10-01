import React, { useEffect, useState, useCallback } from 'react';
import { Mail, Search, Loader2, Send, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { SUPPORT_REASONS, getReasonTemplate, REASON_BADGE_CLASSES } from '@/lib/supportTemplates';
import { sortedTemplatesForReason } from '@/lib/replyTemplates';

const STATUSES = ['open', 'closed', 'all'];

export default function AdminSupport() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const all = await base44.entities.SupportTicket.list('-created_date', 200);
      setTickets(all || []);
    } catch (e) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const filtered = tickets.filter((tk) => {
    if (filter !== 'all' && tk.status !== filter) return false;
    if (reasonFilter !== 'all' && (tk.reason || 'altro') !== reasonFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const reasonLabel = tk.reason ? t(getReasonTemplate(tk.reason)?.labelKey || '') : '';
      return (
        (tk.name || '').toLowerCase().includes(q) ||
        (tk.email || '').toLowerCase().includes(q) ||
        (tk.message || '').toLowerCase().includes(q) ||
        (tk.subject || '').toLowerCase().includes(q) ||
        reasonLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selected = tickets.find((tk) => tk.id === selectedId) || null;

  const handleSendReply = async () => {
    if (!selected || !replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('replySupportTicket', {
        ticket_id: selected.id,
        reply: replyText.trim(),
      });
      if (res?.data?.error) throw new Error(res.data.error);
      toast({
        title: t('support_inbox.reply_sent'),
        description: t('support_inbox.reply_sent_desc'),
      });
      setReplyText('');
      await loadTickets();
    } catch (e) {
      toast({
        title: t('support_inbox.reply_error'),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const openCount = tickets.filter((tk) => tk.status === 'open').length;

  return (
    <AppLayout>
      <PageHeader title={t('support_inbox.title')} subtitle={t('support_inbox.subtitle')} />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                filter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent text-accent-foreground hover:bg-accent/80'
              )}
            >
              {t(`support_inbox.filter_${s}`)}
              {s === 'open' && openCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs rounded-full bg-terracotta text-terracotta-foreground">
                  {openCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('support_inbox.search_placeholder')}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setReasonFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
            reasonFilter === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-terracotta/40'
          )}
        >
          {t('support_inbox.reason_filter_all')}
        </button>
        {SUPPORT_REASONS.map((r) => (
          <button
            key={r.value}
            onClick={() => setReasonFilter(r.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
              reasonFilter === r.value
                ? 'bg-primary text-primary-foreground border-primary'
                : cn('border', REASON_BADGE_CLASSES[r.color], 'hover:opacity-80')
            )}
          >
            {t(r.labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-foreground">{t('support_inbox.no_tickets')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('support_inbox.no_tickets_desc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {filtered.map((tk) => (
              <button
                key={tk.id}
                onClick={() => { setSelectedId(tk.id); setReplyText(''); }}
                className={cn(
                  'w-full text-left rounded-xl border p-4 shadow-sm transition-all hover:shadow-md',
                  selectedId === tk.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-terracotta/40'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{tk.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{tk.email}</p>
                  </div>
                  {tk.status === 'open' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">
                      <Clock className="w-3 h-3" /> {t('support_inbox.status_open')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> {t('support_inbox.status_closed')}
                    </span>
                  )}
                </div>
                {tk.reason && (() => {
                  const tmpl = getReasonTemplate(tk.reason);
                  return tmpl ? (
                    <span className={cn('inline-flex items-center text-xs font-medium border rounded-full px-2 py-0.5 mb-1.5', REASON_BADGE_CLASSES[tmpl.color])}>
                      {t(tmpl.labelKey)}
                    </span>
                  ) : null;
                })()}
                {tk.subject && (
                  <p className="text-sm font-medium text-foreground truncate mb-0.5">{tk.subject}</p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">{tk.message}</p>
              </button>
            ))}
          </div>

          {selected && (
            <div className="md:sticky md:top-4 h-fit">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{selected.name}</span>
                    </div>
                    <a href={`mailto:${selected.email}`} className="text-xs text-primary hover:underline">{selected.email}</a>
                  </div>

                  <div className="rounded-xl bg-accent/50 p-4">
                    {selected.reason && (() => {
                      const tmpl = getReasonTemplate(selected.reason);
                      return tmpl ? (
                        <span className={cn('inline-flex items-center text-xs font-medium border rounded-full px-2 py-0.5 mb-2', REASON_BADGE_CLASSES[tmpl.color])}>
                          {t('support_inbox.reason_label')}: {t(tmpl.labelKey)}
                        </span>
                      ) : null;
                    })()}
                    {selected.subject && (
                      <p className="font-medium text-foreground mb-2">{selected.subject}</p>
                    )}
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selected.message}</p>
                  </div>

                  {selected.status === 'closed' && selected.reply && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">
                        {t('support_inbox.reply_label')}
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selected.reply}</p>
                    </div>
                  )}

                  {selected.status === 'open' ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                          {t('support_inbox.template_label')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {sortedTemplatesForReason(selected.reason || 'altro').map((tpl) => (
                            <button
                              key={tpl.id}
                              onClick={() => setReplyText(t(tpl.bodyKey).replace(/\{name\}/g, selected.name || ''))}
                              className="px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-card text-foreground hover:border-terracotta/50 hover:bg-terracotta/5 transition-colors"
                            >
                              {t(tpl.labelKey)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={t('support_inbox.reply_placeholder')}
                        rows={5}
                      />
                      <Button
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || sending}
                        className="w-full rounded-xl"
                      >
                        {sending ? (
                          <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> {t('support_inbox.sending')}</>
                        ) : (
                          <><Send className="w-4 h-4 mr-1.5" /> {t('support_inbox.send_reply')}</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">{t('support_inbox.already_closed')}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}