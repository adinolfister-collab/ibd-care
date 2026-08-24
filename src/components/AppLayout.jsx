import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { Home, Activity, Utensils, Pill, FileText, MapPin, FileBarChart, Settings as SettingsIcon, LogOut, LogIn, HeartPulse, LineChart as LineChartIcon, Bot, Users, User, BarChart3, ScanLine, Newspaper, TrendingUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import PromoBanner from '@/components/PromoBanner';
import LanguageMenu from '@/components/LanguageMenu';
import TopRightActions from '@/components/TopRightActions';
import LockBadge from '@/components/LockBadge';
import NativeAppButton from '@/components/NativeAppButton';
import { guestSymptoms, guestFoods, syncGuestEntriesToCloud } from '@/lib/guestEntries';
import { useToast } from '@/components/ui/use-toast';

// Pages reserved to Premium subscribers. Guests and free (registered) users
// see them in the nav with a lock and clicking redirects to /abbonamento.
const PREMIUM_ROUTES = new Set([
  '/meds',
  '/records',
  '/esami',
  '/assistant',
  '/trends',
  '/symptom-charts',
  '/summary',
  '/map',
]);

const navItems = [
  { to: '/', key: 'nav.home', icon: Home, exact: true },
  { to: '/news', key: 'nav.news', icon: Newspaper },
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
  const { toast } = useToast();
  const { isSubscribed } = useSubscription();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [syncingGuest, setSyncingGuest] = useState(false);

  const ACCOUNT_ROUTES = new Set(['/account', '/settings']);
  const isLocked = (to) =>
    !isAuthenticated && (PREMIUM_ROUTES.has(to) || ACCOUNT_ROUTES.has(to));

  // On first authenticated mount, migrate any guest entries saved on the
  // device into the user's cloud entities, then clear the local cache. Briefly
  // block rendering so pages load cloud data that already includes them.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!guestSymptoms.has() && !guestFoods.has()) return;
    let cancelled = false;
    (async () => {
      setSyncingGuest(true);
      try {
        const n = await syncGuestEntriesToCloud();
        if (!cancelled && n > 0) {
          toast({ title: t('guest.synced_title'), description: t('guest.synced_desc') });
        }
      } catch {
        /* keep local entries on failure — user can retry next mount */
      } finally {
        if (!cancelled) setSyncingGuest(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  if (syncingGuest) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t('guest.syncing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar (desktop layout forced at all widths) */}
      <aside className="flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-card">
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
            const locked = isLocked(item.to);
            if (locked) {
              return (
                <div key={item.to} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-muted-foreground opacity-70 cursor-default">
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{t(item.key)}</span>
                  <LockBadge />
                </div>
              );
            }
            return (
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
            );
          })}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin/conversioni"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-colors mt-1 border-t border-border pt-4',
                  isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <TrendingUp className="w-5 h-5 shrink-0" />
              <span>Conversioni</span>
            </NavLink>
          )}
        </nav>
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="m-3 flex items-center gap-3 px-4 py-3 rounded-xl text-base text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('settings.logout')}</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="m-3 flex items-center gap-3 px-4 py-3 rounded-xl text-base text-primary hover:bg-accent transition-colors"
          >
            <LogIn className="w-5 h-5" />
            <span>{t('auth.login_btn')}</span>
          </Link>
        )}
      </aside>

      {/* Top-right actions (desktop layout, always visible) */}
      <div className="flex fixed top-4 right-6 z-40">
        <LanguageMenu />
        <NativeAppButton />
        <TopRightActions />
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="min-h-screen pb-8 px-4 md:px-10 py-6 md:py-10 max-w-4xl mx-auto">
          <PromoBanner />
          {children}
        </main>
      </div>

    </div>
  );
}