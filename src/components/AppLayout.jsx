import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Activity, Utensils, Pill, FileText, MapPin, FileBarChart, Settings as SettingsIcon, LogOut, HeartPulse, LineChart as LineChartIcon, Bot } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', key: 'nav.home', icon: Home, exact: true },
  { to: '/symptoms', key: 'nav.symptoms', icon: Activity },
  { to: '/food', key: 'nav.food', icon: Utensils },
  { to: '/meds', key: 'nav.meds', icon: Pill },
  { to: '/records', key: 'nav.records', icon: FileText },
  { to: '/assistant', key: 'nav.assistant', icon: Bot },
  { to: '/trends', key: 'nav.trends', icon: LineChartIcon },
  { to: '/map', key: 'nav.map', icon: MapPin },
  { to: '/summary', key: 'nav.summary', icon: FileBarChart },
  { to: '/settings', key: 'nav.settings', icon: SettingsIcon },
];

export default function AppLayout({ children }) {
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-card">
        <div className="px-6 py-7 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">{t('app.name')}</p>
            <p className="text-xs text-muted-foreground leading-tight">{t('app.tagline')}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-colors',
                  isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{t(item.key)}</span>
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="m-3 flex items-center gap-3 px-4 py-3 rounded-xl text-base text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('settings.logout')}</span>
        </button>
      </aside>

      {/* Mobile secondary top bar */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-b border-border bg-card/90 backdrop-blur sticky top-0 z-30">
        {navItems.slice(5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
              )
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{t(item.key)}</span>
          </NavLink>
        ))}
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="min-h-screen pb-24 md:pb-8 px-4 md:px-10 py-6 md:py-10 max-w-4xl mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border">
        <div className="grid grid-cols-5">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors',
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="w-6 h-6" />
              <span>{t(item.key)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}