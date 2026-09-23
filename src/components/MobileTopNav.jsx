import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  Home, Activity, Utensils, Pill, FileText, ScanLine, MapPin, FileBarChart,
  Settings as SettingsIcon, LogOut, LogIn, HeartPulse, LineChart as LineChartIcon,
  Bot, Users, User, BarChart3, Newspaper, TrendingUp, GitCompare, ShoppingBag, Crown, CreditCard, Megaphone,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import LanguageMenu from '@/components/LanguageMenu';
import NativeAppButton from '@/components/NativeAppButton';
import TopRightActions from '@/components/TopRightActions';
import DesktopViewToggle from '@/components/DesktopViewToggle';

// Mobile-only top bar: compact header (logo + actions) over a horizontally
// scrollable row of chips grouped by theme. Hidden on md+ where the sidebar
// takes over.
export default function MobileTopNav({ user, isAuthenticated, onLogout }) {
  const { t } = useI18n();
  const location = useLocation();
  const activeRef = useRef(null);

  const groups = [
    {
      key: 'nav.group_diario',
      items: [
        { to: '/symptoms', key: 'nav.symptoms', icon: Activity },
        { to: '/food', key: 'nav.food', icon: Utensils },
        { to: '/meds', key: 'nav.meds', icon: Pill },
        { to: '/esami', key: 'nav.esami', icon: ScanLine },
        { to: '/records', key: 'nav.records', icon: FileText },
      ],
    },
    {
      key: 'nav.group_insight',
      items: [
        { to: '/trends', key: 'nav.trends', icon: LineChartIcon },
        { to: '/symptom-charts', key: 'nav.symptom_charts', icon: BarChart3 },
        { to: '/correlazioni', key: 'nav.correlazioni', icon: GitCompare },
        { to: '/summary', key: 'nav.summary', icon: FileBarChart },
        { to: '/assistant', key: 'nav.assistant', icon: Bot },
      ],
    },
    {
      key: 'nav.group_extra',
      items: [
        { to: '/', key: 'nav.home', icon: Home, exact: true },
        { to: '/founders', key: 'nav.founders', icon: Crown, founder: true },
        { to: '/news', key: 'nav.news', icon: Newspaper },
        { to: '/community', key: 'nav.community', icon: Users },
        { to: '/map', key: 'nav.map', icon: MapPin },
        { to: '/shop', key: 'nav.shop', icon: ShoppingBag, soon: true },
        { to: '/abbonamento', key: 'nav.abbonamento', icon: CreditCard },
        { to: '/account', key: 'settings.account', icon: User },
        { to: '/settings', key: 'nav.settings', icon: SettingsIcon },
      ],
    },
  ];

  // Account & settings require login — hide them for guests.
  if (!isAuthenticated) {
    groups[2].items = groups[2].items.filter((it) => it.to !== '/account' && it.to !== '/settings');
  }
  // Admin-only voices live in the "Extra" group, mirroring the desktop sidebar.
  if (user?.role === 'admin') {
    groups[2].items.push({ to: '/admin/conversioni', key: 'nav.conversions', icon: TrendingUp });
    groups[2].items.push({ to: '/admin/marketing', key: 'nav.marketing', icon: Megaphone });
    groups[2].items.push({ to: '/shop/admin', key: 'shop.admin_nav', icon: ShoppingBag });
  }

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [location.pathname]);

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(item.to + '/');

  return (
    <header className="md:hidden sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-terracotta/50">
      <div className="flex items-center justify-between h-12 px-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/25 to-accent/60 flex items-center justify-center shrink-0">
            <HeartPulse className="w-4 h-4 text-primary" />
          </div>
          <p className="font-heading font-semibold tracking-tight text-sm truncate">{t('app.name')}</p>
        </div>
        <div className="flex items-center gap-1">
          <DesktopViewToggle />
          <LanguageMenu />
          <NativeAppButton />
          <TopRightActions />
          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent"
              aria-label={t('settings.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/login"
              className="h-9 w-9 rounded-full flex items-center justify-center text-primary hover:bg-accent"
              aria-label={t('auth.login_btn')}
            >
              <LogIn className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <nav className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-px-2">
        <div className="flex items-center gap-2 px-2 pb-2">
          {groups.map((group, gi) => (
            <React.Fragment key={group.key}>
              {gi > 0 && <div className="w-px self-stretch my-1.5 bg-border shrink-0" />}
              <div className="flex items-center gap-1.5 shrink-0 px-0.5">
                <span className="text-[0.55rem] font-heading uppercase tracking-[0.15em] text-terracotta/80 pr-0.5">
                  {t(group.key)}
                </span>
                {group.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      ref={active ? activeRef : undefined}
                      className={cn(
                        'inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[0.8rem] whitespace-nowrap snap-center transition-colors',
                        item.founder
                          ? 'border border-terracotta/60 bg-terracotta/10 text-terracotta font-medium'
                          : active
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{t(item.key)}</span>
                      {item.founder && <span className="text-[0.55rem] font-semibold uppercase bg-terracotta text-terracotta-foreground px-1 py-0.5 rounded-full">★</span>}
                      {item.soon && <span className="text-[0.55rem] font-semibold uppercase bg-terracotta/15 text-terracotta px-1.5 py-0.5 rounded-full">Presto</span>}
                    </NavLink>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </nav>
    </header>
  );
}