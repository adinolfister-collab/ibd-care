import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Utensils, FileBarChart, MapPin, Pill, FileText, Plus, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import ShareApp from '@/components/ShareApp';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PullToRefresh from '@/components/PullToRefresh';

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
  useEffect(() => { loadHome(true); }, []);

  return (
    <AppLayout>
      <PullToRefresh onRefresh={() => loadHome(false)}>
      <PageHeader title={`${t('home.welcome')}${user?.full_name ? ', ' + user.full_name.split(' ')[0] : ''} 👋`} subtitle={t('app.tagline')} action={<ShareApp variant="icon" />} />

      {/* Today status */}
      <Card className="mb-6 border-0 shadow-sm bg-gradient-to-br from-primary/5 to-accent/40">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-muted-foreground mb-1">{t('home.today_status')}</p>
          {todaySymptom ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <Stat label={t('symptoms.pain')} value={`${todaySymptom.pain_level ?? 0}/10`} tone={tone(todaySymptom.pain_level)} />
              <Stat label={t('symptoms.fatigue')} value={`${todaySymptom.fatigue_level ?? 0}/10`} tone={tone(todaySymptom.fatigue_level)} />
              <Stat label={t('symptoms.bowel')} value={todaySymptom.bowel_movements_count ?? 0} />
              <Stat label={t('symptoms.stool')} value={`Tipo ${todaySymptom.stool_consistency ?? '-'}`} />
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-muted-foreground">Nessuna registrazione per oggi.</p>
              <Link to="/symptoms">
                <Button className="rounded-xl">
                  <Plus className="w-4 h-4 mr-1.5" /> {t('home.log_symptom')}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold mb-3">{t('home.quick_actions')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {quickActions.map((a) => (
          <Link key={a.to} to={a.to}>
            <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Med reminders */}
        <div>
          <h2 className="text-lg font-semibold mb-3">{t('home.med_reminders')}</h2>
          <Card className="border-0 shadow-sm">
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
        </div>

        {/* Recent */}
        <div>
          <h2 className="text-lg font-semibold mb-3">{t('home.recent')}</h2>
          <Card className="border-0 shadow-sm">
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
        </div>
      </div>
      </PullToRefresh>
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