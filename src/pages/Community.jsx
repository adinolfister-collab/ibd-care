import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Users, Send, MessageSquare, Trash2, CornerDownRight, ShieldCheck, ShieldAlert, Heart, MessagesSquare, UserCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import MagazineEssay from '@/components/MagazineEssay';
import EmptyState from '@/components/EmptyState';
import PageShareButtons from '@/components/PageShareButtons';
import LanguageMenu from '@/components/LanguageMenu';
import TopRightActions from '@/components/TopRightActions';
import AppLayout from '@/components/AppLayout';
import SiteMenu from '@/components/SiteMenu';
import { Card, CardContent } from '@/components/ui/card';
import VoiceButton from '@/components/VoiceButton';
import CommunityFoundersRanking from '@/components/CommunityFoundersRanking';
import { clearFoundersCache } from '@/hooks/useFoundersRanking';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'ora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString();
}

const CATEGORIES = [
  { value: 'generale', icon: MessageSquare, tone: 'bg-accent text-accent-foreground' },
  { value: 'consigli', icon: MessagesSquare, tone: 'bg-sky-100 text-sky-700' },
  { value: 'alimentazione', icon: Heart, tone: 'bg-emerald-100 text-emerald-700' },
  { value: 'sintomi', icon: Heart, tone: 'bg-amber-100 text-amber-700' },
  { value: 'emotivo', icon: Heart, tone: 'bg-rose-100 text-rose-700' },
];

const SOLIDARITY = [
  'Non sei solo: tante persone affrontano questo percorso insieme a te.',
  'Ogni piccolo passo conta. Condividere aiuta te e gli altri.',
  'La tua esperienza può illuminare il cammino di qualcun altro.',
  'Nei momenti difficili, sapere di non essere soli fa la differenza.',
];

const STARTERS = [
  'Come gestisci i momenti di riacutizzazione?',
  'Quali cibi hai scoperto di tollerare meglio?',
  'Come spieghi l\u2019IBD a chi ti sta vicino?',
  'Quali strategie ti aiutano nei giorni più faticosi?',
];

const BANNED = ['stronzo', 'stronz', 'cazzo', 'figa', 'puttana', 'troia', 'merda', 'minchia', 'negro', 'mongolo', 'ritardato', 'frocio', 'ricchione', 'bastardo', 'vaffanculo', 'fuck', 'shit', 'bitch', 'asshole', 'slut', 'retard', 'nigger', 'faggot'];
const containsBanned = (txt) => {
  const low = (txt || '').toLowerCase();
  return BANNED.some((w) => low.includes(w));
};

export default function Community() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { isAuthenticated, authChecked } = useAuth();
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState('');
  const [me, setMe] = useState(null);
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [moderationWarning, setModerationWarning] = useState('');
  const [category, setCategory] = useState('generale');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    const data = await base44.entities.CommunityMessage.list('-created_date', 500);
    setMessages(data);
  };

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setMe(u);
      } catch (e) {}
      try {
        await load();
      } catch (e) {
        setMessages([]);
      }
    })();
    const unsub = base44.entities.CommunityMessage.subscribe(() => {
      load();
    });
    return unsub;
  }, []);

  const isAdmin = me?.role === 'admin';

  const post = async (content, parentId = null, cat = category) => {
    if (!content || !content.trim() || posting) return;
    if (containsBanned(content)) {
      setModerationWarning('Il messaggio contiene linguaggio non appropriato. Riformulalo per mantenere lo spazio accogliente.');
      return;
    }
    setModerationWarning('');
    setPosting(true);
    try {
      let parentCat = cat;
      if (parentId && messages) {
        const parent = messages.find((m) => m.id === parentId);
        parentCat = parent?.category || cat;
      }
      await base44.entities.CommunityMessage.create({
        content: content.trim(),
        author_name: me?.full_name || 'Utente',
        parent_id: parentId,
        category: parentCat || 'generale',
      });
      if (!parentId) setText('');
      else setReplyText((s) => ({ ...s, [parentId]: '' }));
      setReplyTo(null);
      // Founder campaign: confirm the spot on the user's first community post.
      try {
        const res = await base44.functions.invoke('confirmFoundersSignup', {});
        if (res.data?.confirmed && !res.data?.already) {
          clearFoundersCache();
          const isLife = res.data.slot_type === 'lifetime';
          toast({ title: (isLife ? t('founders.confirm_toast') : t('founders.confirm_toast_three')).replace('{n}', res.data.rank || '') });
        }
      } catch (e) { /* non-critical */ }
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id) => {
    await base44.entities.CommunityMessage.delete(id);
  };

  const moderate = async (id) => {
    try {
      await base44.functions.invoke('moderateCommunityMessage', { message_id: id });
    } catch (e) {
      setModerationWarning('Impossibile rimuovere il messaggio. Riprova.');
    }
  };

  const stats = useMemo(() => {
    const list = messages || [];
    const authors = new Set(list.map((m) => m.author_name).filter(Boolean));
    return { messages: list.length, authors: authors.size };
  }, [messages]);

  const solidarity = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    return SOLIDARITY[day % SOLIDARITY.length];
  }, []);

  const topLevel = (messages || []).filter((m) => !m.parent_id && (filter === 'all' || m.category === filter));
  const repliesOf = (id) => (messages || []).filter((m) => m.parent_id === id);

  return (
    <AppLayout>
      <PageHeader
        title={t('community.title')}
        subtitle={t('community.subtitle')}
        action={<PageShareButtons title={t('community.title')} summary={t('community.subtitle')} path="/community" label={t('share.page')} />}
      />
      <PageEditorial pageKey="community" />
      <CommunityFoundersRanking />
      <SiteMenu />
      <MagazineEssay theme="community" number="01" eyebrow="Board" title="La board">
      {/* Solidarity card */}
      <Card className="mb-5 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{t('community.solidarity_title')}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{solidarity}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-primary" /> {stats.messages} {t('community.stat_messages')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserCircle2 className="w-4 h-4 text-primary" /> {stats.authors} {t('community.stat_people')}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safe space note */}
      <Card className="mb-5 border-amber-200/60 bg-amber-50/50">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">{t('community.guidelines')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Composer */}
      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    category === c.value ? c.tone + ' ring-2 ring-primary/40' : 'bg-accent text-accent-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t('community.cat_' + c.value)}
                </button>
              );
            })}
          </div>
          {authChecked && isAuthenticated ? (
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('community.placeholder')}
                rows={2}
                className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <VoiceButton onResult={(txt) => setText((c) => (c ? c + ' ' : '') + txt)} />
              <Button onClick={() => post(text)} disabled={!text.trim() || posting} className="h-12 px-5">
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">{t('community.post')}</span>
              </Button>
            </div>
          ) : (
            <div className="rounded-xl bg-accent/50 border border-border px-4 py-3 text-center">
              <p className="text-sm text-muted-foreground mb-3">{t('community.login_to_post')}</p>
              <div className="flex justify-center gap-2">
                <Link to="/login" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">{t('community.login_btn')}</Link>
                <Link to="/register" className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">{t('community.register_btn')}</Link>
              </div>
            </div>
          )}
          {moderationWarning && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 text-amber-800 px-3 py-2 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{moderationWarning}</span>
            </div>
          )}
          {isAdmin && (
            <p className="mt-2 text-[11px] text-primary flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {t('community.moderator_note')}
            </p>
          )}

          {/* Conversation starters */}
          {authChecked && isAuthenticated && (
            <div className="mt-3">
              <p className="text-[11px] text-muted-foreground mb-2">{t('community.starters')}</p>
              <div className="flex flex-wrap gap-1.5">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setText(s + ' '); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-1.5 mb-5">
        <button
          onClick={() => setFilter('all')}
          className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-colors', filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}
        >
          {t('community.filter_all')}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors', filter === c.value ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}
          >
            {t('community.cat_' + c.value)}
          </button>
        ))}
      </div>

      {!messages ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : topLevel.length === 0 ? (
        <EmptyState icon={MessageSquare} title={t('community.empty')} />
      ) : (
        <div className="space-y-4">
          {topLevel.map((m) => {
            const mine = me && m.created_by_id === me.id;
            const reps = repliesOf(m.id);
            const cat = CATEGORIES.find((c) => c.value === (m.category || 'generale'));
            return (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0">
                      {(m.author_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{m.author_name || t('community.anonymous')}</p>
                          {cat && (
                            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', cat.tone)}>
                              {t('community.cat_' + cat.value)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{timeAgo(m.created_date)}</span>
                          {(mine || isAdmin) && (
                            <button
                              onClick={() => (mine ? remove(m.id) : moderate(m.id))}
                              className={cn('transition-colors', mine ? 'text-muted-foreground hover:text-destructive' : 'text-primary hover:text-primary/80')}
                              title={mine ? 'Elimina' : 'Rimuovi come moderatore'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap break-words">{m.content}</p>

                      {isAuthenticated && (
                        <button
                          onClick={() => setReplyTo(replyTo === m.id ? null : m.id)}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <CornerDownRight className="w-3.5 h-3.5" />
                          {t('community.reply')}
                        </button>
                      )}

                      {isAuthenticated && replyTo === m.id && (
                        <div className="mt-2 flex items-end gap-2">
                          <textarea
                            value={replyText[m.id] || ''}
                            onChange={(e) => setReplyText((s) => ({ ...s, [m.id]: e.target.value }))}
                            placeholder={t('community.placeholder')}
                            rows={1}
                            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                          <Button size="sm" onClick={() => post(replyText[m.id] || '', m.id)} disabled={!(replyText[m.id] || '').trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {/* Replies */}
                      {reps.length > 0 && (
                        <div className="mt-3 space-y-2 pl-3 border-l-2 border-border">
                          {reps.map((r) => {
                            const rMine = me && r.created_by_id === me.id;
                            return (
                              <div key={r.id} className="flex items-start gap-2">
                                <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-medium shrink-0">
                                  {(r.author_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium text-xs">{r.author_name || t('community.anonymous')}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-muted-foreground">{timeAgo(r.created_date)}</span>
                                      {(rMine || isAdmin) && (
                                        <button
                                          onClick={() => (rMine ? remove(r.id) : moderate(r.id))}
                                          className={cn('transition-colors', rMine ? 'text-muted-foreground hover:text-destructive' : 'text-primary hover:text-primary/80')}
                                          title={rMine ? 'Elimina' : 'Rimuovi come moderatore'}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{r.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </MagazineEssay>
      <EditorialBlock sectionKey="community_voice" align="right" />
    </AppLayout>
  );
}