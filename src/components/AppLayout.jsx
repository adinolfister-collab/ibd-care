import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { Home, Activity, Utensils, Pill, FileText, MapPin, FileBarChart, Settings as SettingsIcon, LogOut, LogIn, HeartPulse, LineChart as LineChartIcon, Bot, Users, User, BarChart3, ScanLine, Newspaper, TrendingUp, GitCompare, ShoppingBag, Crown, CreditCard,   Megaphone, BookOpen } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import LanguageMenu from '@/components/LanguageMenu';
import TopRightActions from '@/components/TopRightActions';
import MobileTopNav from '@/components/MobileTopNav';
import NativeAppButton from '@/components/NativeAppButton';
import DesktopViewToggle from '@/components/DesktopViewToggle';
import { useDesktopView } from '@/hooks/useDesktopView';
import { guestSymptoms, guestFoods, guestRecords, syncGuestEntriesToCloud } from '@/lib/guestEntries';
import { useToast } from '@/components/ui/use-toast';

// Public app — every section is open to all visitors. Account management
// (settings/account/admin) requires login, enforced by the route guard.
const navItems = [
  { to: '/', key: 'nav.home', icon: Home, exact: true },
  { to: '/guida', key: 'nav.guide', icon: BookOpen },
  { to: '/founders', key: 'nav.founders', icon: Crown, founder: true },
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
  { to: '/correlazioni', key: 'nav.correlazioni', icon: GitCompare },
  { to: '/map', key: 'nav.map', icon: MapPin },
  { to: '/summary', key: 'nav.summary', icon: FileBarChart },
  { to: '/shop', key: 'nav.shop', icon: ShoppingBag, soon: true },
  { to: '/abbonamento', key: 'nav.abbonamento', icon: CreditCard },
  { to: '/account', key: 'settings.account', icon: User },
  { to: '/settings', key: 'nav.settings', icon: SettingsIcon },
];

export default function AppLayout({ children }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { forceDesktop } = useDesktopView();
  const [syncingGuest, setSyncingGuest] = useState(false);

  // On first authenticated mount, migrate any guest entries saved on the
  // device into the user's cloud entities, then clear the local cache. Briefly
  // block rendering so pages load cloud data that already includes them.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!guestSymptoms.has() && !guestFoods.has() && !guestRecords.has()) return;
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
      <aside className={cn('fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-card', forceDesktop ? 'flex' : 'hidden md:flex')}>
        <div className="px-6 py-7 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/25 to-accent/60 flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-lg font-heading font-semibold tracking-tight">{t('app.name')}</p>
            <p className="text-xs text-muted-foreground leading-tight">{t('app.tagline')}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => isAuthenticated || (item.to !== '/account' && item.to !== '/settings'))
            .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-colors',
                  item.founder
                    ? 'border border-terracotta/60 bg-terracotta/10 text-terracotta hover:bg-terracotta/15 font-medium'
                    : isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className={cn('w-5 h-5 shrink-0', item.founder && 'text-terracotta')} />
              <span>{t(item.key)}</span>
              {item.founder && <span className="ml-auto text-[0.6rem] font-semibold uppercase tracking-wide bg-terracotta text-terracotta-foreground px-1.5 py-0.5 rounded-full">Founder</span>}
              {item.soon && <span className="ml-auto text-[0.6rem] font-semibold uppercase tracking-wide bg-terracotta/15 text-terracotta px-1.5 py-0.5 rounded-full">Presto</span>}
            </NavLink>
          ))}
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
          {user?.role === 'admin' && (
            <NavLink
              to="/admin/marketing"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-colors',
                  isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Megaphone className="w-5 h-5 shrink-0" />
              <span>Marketing social</span>
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink
              to="/shop/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-colors',
                  isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <ShoppingBag className="w-5 h-5 shrink-0" />
              <span>{t('shop.admin_nav')}</span>
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
          <div className="m-3 p-3 rounded-xl border border-terracotta/40 bg-terracotta/5 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed px-1">{t('guest.banner_desc')}</p>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-base bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>{t('auth.login_btn')}</span>
            </Link>
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-base border border-terracotta/50 text-terracotta font-medium hover:bg-terracotta/10 transition-colors"
            >
              <span>{t('paywall.cta_register')}</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Top-right actions (desktop layout, always visible) */}
      <div className={cn('fixed top-4 right-6 z-40', forceDesktop ? 'flex' : 'hidden md:flex')}>
        <DesktopViewToggle />
        <LanguageMenu />
        <NativeAppButton />
        <TopRightActions />
      </div>

      {/* Mobile top navigation (hidden on desktop and in forced-desktop mode) */}
      {!forceDesktop && <MobileTopNav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />}

      {/* Main content */}
      <div className={forceDesktop ? 'pl-64' : 'md:pl-64'}>
        <main className="min-h-screen pb-10 px-4 md:px-10 py-5 md:py-10 max-w-4xl mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}