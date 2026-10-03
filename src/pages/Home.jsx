import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Utensils, FileBarChart, MapPin, Pill, Plus, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import HomeMarketing from '@/components/HomeMarketing';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import EditorialSlider from '@/components/EditorialSlider';
import HomeCompanionReport from '@/components/HomeCompanionReport';
import MagazineEssay from '@/components/MagazineEssay';
import ShareMenu from '@/components/ShareMenu';
import InviteFriendButton from '@/components/InviteFriendButton';
import DownloadApp from '@/components/DownloadApp';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PullToRefresh from '@/components/PullToRefresh';
import AppQrCode from '@/components/AppQrCode';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const quickActions = [
  { to: '/symptoms', key: 'home.log_symptom', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
  { to: '/food', key: 'home.log_meal', icon: Utensils, color: 'text-amber-600', bg: 'bg-amber-50' },
  { to: '/summary', key: 'home.view_summary', icon: FileBarChart, color: 'text-primary', bg: 'bg-primary/10' },
  { to: '/map', key: 'home.find_service', icon: MapPin, color: 'text-sky-600', bg: 'bg-sky-50' },
];

export default function Home() {
  const { t } = useI18n();
  const { isAuthenticated, authChecked } = useAuth();
  const [user, setUser] = useState(null);
  const [todaySymptom, setTodaySymptom] = useState(null);
  const [meds, setMeds] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHome = async (initial) => {
    if (initial) setLoading(true);
    try {
      const me = await base44.auth.me();
      setUser(me);
    } catch (e) {
      /* ignore */
    }
    try {
      const items = await base44.entities.SymptomEntry.filter({ entry_date: todayStr() }, '-created_date', 1);
      setTodaySymptom(items[0] || null);
    } catch (e) {}
    try {
      setMeds(await base44.entities.Medication.filter({ active: true }, '-created_date', 50));
    } catch (e) {}
    try {
      const syms = await base44.entities.SymptomEntry.list('-created_date', 3);
      const foods = await base44.entities.FoodEntry.list('-created_date', 3);
      const merged = [
        ...syms.map((s) => ({ kind: 'symptom', date: s.entry_date, id: s.id })),
        ...foods.map((f) => ({ kind: 'food', date: f.entry_date, id: f.id, foods: f.foods })),
      ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setRecent(merged.slice(0, 5));
    } catch (e) {}
    if (initial) setLoading(false);
  };
  useEffect(() => { if (authChecked && isAuthenticated) loadHome(true); }, [authChecked, isAuthenticated]);

  if (!authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <HomeMarketing />;
  }
  return (
    <AppLayout>
      <PullToRefresh onRefresh={() => loadHome(false)}>
      <PageHeader
        title={`${t('home.welcome')}${user?.full_name ? ', ' + user.full_name.split(' ')[0] : ''} 👋`}
        subtitle={t('app.tagline')}
        action={
          <div className="flex items-center gap-2">
            <DownloadApp variant="icon" />
            <ShareMenu variant="icon" />
          </div>
        }
      />
      <PageEditorial pageKey="home" />
      <EditorialSlider />
      <InviteFriendButton />
      <HomeCompanionReport />

      {/* N. 01 — Stato di oggi */}
      <MagazineEssay theme="sintomi" number="01" eyebrow={t('home.eyebrow_today')} title={t('home.today_status')} to="/symptoms">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-accent/40">
          <CardContent className="p-6">
            {todaySymptom ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label={t('symptoms.pain')} value={`${todaySymptom.pain_level ?? 0}/10`} tone={tone(todaySymptom.pain_level)} />
                <Stat label={t('symptoms.fatigue')} value={`${todaySymptom.fatigue_level ?? 0}/10`} tone={tone(todaySymptom.fatigue_level)} />
                <Stat label={t('symptoms.bowel')} value={todaySymptom.bowel_movements_count ?? 0} />
                <Stat label={t('symptoms.stool')} value={t('symptoms.stool_type').replace('{n}', todaySymptom.stool_consistency ?? '-')} />
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-muted-foreground">{t('home.no_today')}</p>
                <Link to="/symptoms">
                  <Button className="rounded-xl">
                    <Plus className="w-4 h-4 mr-1.5" /> {t('home.log_symptom')}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </MagazineEssay>

      {/* N. 02 — Accesso rapido */}
      <MagazineEssay theme="alimentazione" number="02" eyebrow={t('home.eyebrow_quick')} title={t('home.quick_actions')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to}>
              <Card className="h-full border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-card">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', a.bg)}>
                    <a.icon className={cn('w-6 h-6', a.color)} />
                  </div>
                  <span className="text-sm font-medium leading-snug">{t(a.key)}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </MagazineEssay>

      {/* N. 03 — Promemoria terapie */}
      <MagazineEssay theme="terapie" number="03" eyebrow={t('home.eyebrow_care')} title={t('home.med_reminders')} to="/meds">
        <Card className="border border-border shadow-sm bg-card">
          <CardContent className="p-4">
            {meds.length === 0 ? (
              <EmptyState icon={Pill} title={t('home.no_reminders')} />
            ) : (
              <ul className="divide-y divide-border">
                {meds.map((m) => (
                  <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">{m.dosage || m.type} · {m.times || m.frequency}</p>
                    </div>
                    <span className="text-sm font-medium text-primary whitespace-nowrap">{m.times?.split(',')[0]?.trim() || ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </MagazineEssay>

      {/* N. 04 — Registrazioni recenti */}
      <MagazineEssay theme="serena" number="04" eyebrow={t('home.eyebrow_history')} title={t('home.recent')} to="/symptoms">
        <Card className="border border-border shadow-sm bg-card">
          <CardContent className="p-4">
            {recent.length === 0 ? (
              <EmptyState icon={Calendar} title={t('common.empty')} />
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((r) => (
                  <li key={r.kind + r.id} className="py-3 flex items-center gap-3">
                    {r.kind === 'symptom' ? <Activity className="w-5 h-5 text-rose-400" /> : <Utensils className="w-5 h-5 text-amber-500" />}
                    <div>
                      <p className="text-sm font-medium">{r.kind === 'symptom' ? t('nav.symptoms') : r.foods?.slice(0, 32) || t('nav.food')}</p>
                      <p className="text-xs text-muted-foreground">{r.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </MagazineEssay>

      {/* Scarica l'app — QR code */}
      <div className="mb-8 md:mb-10">
        <AppQrCode />
      </div>
      </PullToRefresh>
      <EditorialBlock sectionKey="home_insight" align="right" number="05" to="/summary" />
    </AppLayout>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-semibold mt-0.5', tone)}>{value}</p>
    </div>
  );
}
function tone(v) {
  if (v == null) return '';
  if (v >= 7) return 'text-rose-500';
  if (v >= 4) return 'text-amber-600';
  return 'text-emerald-600';
}