import React from 'react';
import { Link } from 'react-router-dom';
import {
  Newspaper, Users, Activity, Utensils, Info, Mail,
  Pill, FileText, ScanLine, LineChart, BarChart3, Bot, MapPin,
  FileBarChart, Settings as SettingsIcon, User, GitCompare, ShoppingBag,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Sezione "Esplora la rivista": elenco visibile di tutte le pagine dell'app.
// App pubblica: nessuna voce è bloccata.
const ITEMS = [
  { to: '/news', key: 'nav.news', icon: Newspaper },
  { to: '/community', key: 'nav.community', icon: Users },
  { to: '/symptoms', key: 'nav.symptoms', icon: Activity },
  { to: '/food', key: 'nav.food', icon: Utensils },
  { to: '/shop', key: 'nav.shop', icon: ShoppingBag },
  { to: '/about', key: 'nav.about', icon: Info },
  { to: '/contact', key: 'nav.contact', icon: Mail },
  { to: '/meds', key: 'nav.meds', icon: Pill },
  { to: '/records', key: 'nav.records', icon: FileText },
  { to: '/esami', key: 'nav.esami', icon: ScanLine },
  { to: '/trends', key: 'nav.trends', icon: LineChart },
  { to: '/symptom-charts', key: 'nav.symptom_charts', icon: BarChart3 },
  { to: '/correlazioni', key: 'nav.correlazioni', icon: GitCompare },
  { to: '/assistant', key: 'nav.assistant', icon: Bot },
  { to: '/map', key: 'nav.map', icon: MapPin },
  { to: '/summary', key: 'nav.summary', icon: FileBarChart },
  { to: '/settings', key: 'nav.settings', icon: SettingsIcon },
  { to: '/account', key: 'settings.account', icon: User },
];

export default function SiteMenu() {
  const { t } = useI18n();

  return (
    <section className="my-8 md:my-10">
      <div className="flex items-start gap-3 mb-5">
        <div className="mt-2 h-10 w-1.5 rounded-full bg-terracotta shrink-0" />
        <div className="max-w-2xl">
          <p className="font-heading text-xl md:text-2xl font-semibold text-primary tracking-tight leading-snug">
            {t('home.explore_title') || 'Esplora la rivista'}
          </p>
          <p className="mt-1 text-sm md:text-[0.95rem] text-muted-foreground leading-relaxed">
            {t('home.explore_desc') || "Tutte le sezioni dell'app, a portata di tap."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ITEMS.map((item) => (
          <Link key={item.to} to={item.to} className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all hover:shadow-md hover:border-terracotta/50">
            <span className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 group-hover:bg-terracotta/15 transition-colors">
              <item.icon className="w-5 h-5 text-primary" />
            </span>
            <span className="flex-1 min-w-0 font-heading text-base md:text-lg font-medium text-foreground tracking-tight truncate">
              {t(item.key)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}