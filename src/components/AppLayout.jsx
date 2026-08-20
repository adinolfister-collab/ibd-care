import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Activity, Utensils, Pill, FileText, MapPin, FileBarChart, Settings as SettingsIcon, LogOut, HeartPulse, LineChart as LineChartIcon, Bot, Users, User, BarChart3, Lock, ScanLine } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import PromoBanner from '@/components/PromoBanner';
import LanguageButtons from '@/components/LanguageButtons';
import TopRightActions from '@/components/TopRightActions';

// Pages reserved to Premium subscribers. Free (registered) users can still
// see them in the nav, but clicking redirects to the subscription page.
const PREMIUM_ROUTES = new Set([
  '/food',
  '/meds',
  '/records',
  '/assistant',
  '/community',
  '/trends',
  '/symptom-charts',
  '/summary',
  '/esami',
]);

const navItems = [
  { to: '/', key: 'nav.home', icon: Home, exact: true },
  { to: '/symptoms', key: 'nav.symptoms', icon: Activity },
  { to: '/food', key: 'nav.food', icon: Utensils },
  { to: '/meds', key: 'nav.meds', icon: Pill },
  { to: '/records', key: 'nav.records', icon: FileText },
  { to: '/esami', key: 'nav.esami', icon: ScanLine },
  { to: '/assistant', key: 'nav.assistant', icon: Bot },
  { to: '/community', key: 'nav.community', icon: Users },
  { to: '/trends', key: 'nav.trends', icon: LineChartIcon },
  { to: '/symptom-charts', key: 'nav.symptom_charts', icon: BarChart3 },
  { to: '/map', key: 'nav.map', icon: MapPin },
  { to: '/summary', key: 'nav.summary', icon: FileBarChart },
  { to: '/account', key: 'settings.account', icon: User },
  { to: '/settings', key: 'nav.settings', icon: SettingsIcon },
];

export default function AppLayout({ children }) {
  const { t } = useI18n();
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();

  const isPremium = (to) => PREMIUM_ROUTES.has(to);
  const navTo = (to) => (!isSubscribed && isPremium(to) ? '/abbonamento' : to);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-card">
        <div className="px-6 py-7 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/60 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-lg font-heading font-semibold tracking-tight">{t('app.name')}</p>
            <p className="text-xs text-muted-foreground leading-tight">{t('app.tagline')}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const locked = !isSubscribed && isPremium(item.to);
            return (
              <NavLink
                key={item.to}
                to={navTo(item.to)}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-colors',
                    locked && 'opacity-60',
                    isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{t(item.key)}</span>
                {locked && <Lock className="w-3.5 h-3.5 ml-auto text-muted-foreground/70" />}
              </NavLink>
            );
          })}
        </nav>
        <div className="px-4 pb-2">
          <LanguageButtons />
        </div>
        <button
          onClick={handleLogout}
          className="m-3 flex items-center gap-3 px-4 py-3 rounded-xl text-base text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('settings.logout')}</span>
        </button>
      </aside>

      {/* Mobile secondary top bar */}
      <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-border bg-card/90 backdrop-blur sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {navItems.slice(5).map((item) => {
            const locked = !isSubscribed && isPremium(item.to);
            return (
              <NavLink
                key={item.to}
                to={navTo(item.to)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                    locked && 'opacity-60',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{t(item.key)}</span>
                {locked && <Lock className="w-3 h-3 text-muted-foreground" />}
              </NavLink>
            );
          })}
        </div>
        <TopRightActions />
      </div>

      {/* Desktop top-right actions */}
      <div className="hidden md:flex fixed top-4 right-6 z-40">
        <TopRightActions />
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="min-h-screen pb-24 md:pb-8 px-4 md:px-10 py-6 md:py-10 max-w-4xl mx-auto">
          <div className="md:hidden flex justify-center mb-3">
            <LanguageButtons />
          </div>
          <PromoBanner />
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid grid-cols-5">
          {navItems.slice(0, 5).map((item) => {
            const locked = !isSubscribed && isPremium(item.to);
            return (
              <NavLink
                key={item.to}
                to={navTo(item.to)}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors',
                    locked && 'opacity-60',
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  )
                }
              >
                <div className="relative">
                  <item.icon className="w-6 h-6" />
                  {locked && <Lock className="w-3 h-3 absolute -top-1 -right-1.5 text-muted-foreground bg-card rounded-full p-0.5 box-border" />}
                </div>
                <span>{t(item.key)}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}