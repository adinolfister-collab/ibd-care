import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, Users, Sparkles, User as UserIcon, LogIn } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Mobile-only fixed bottom tab bar for the native webview. Hidden on md+
// where the sidebar takes over. Respects the home indicator via safe-area.
//
// Navigation behaviour:
// - Switching tabs uses normal push navigation, so the browser back button
//   preserves history across tabs ("independent history where possible").
// - Re-selecting the already-active tab resets that tab back to its root:
//   if the user navigated into a sub-path, we return to the tab root, and we
//   scroll to the top.
export default function MobileBottomNav({ isAuthenticated }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { to: '/', key: 'nav.home', icon: Home, exact: true },
    { to: '/symptoms', key: 'nav.symptoms', icon: Activity },
    { to: '/community', key: 'nav.community', icon: Users },
    { to: '/abbonamento', key: 'nav.abbonamento', icon: Sparkles },
    isAuthenticated
      ? { to: '/account', key: 'settings.account', icon: UserIcon }
      : { to: '/login', key: 'auth.login_btn', icon: LogIn },
  ];

  const isTabActive = (item) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(item.to + '/');

  const handleClick = (e, item) => {
    if (isTabActive(item)) {
      // Re-tap on the active tab: reset it to its root view.
      e.preventDefault();
      if (location.pathname !== item.to) {
        navigate(item.to);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Inactive tab: let NavLink push normally to preserve history.
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around">
        {tabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={(e) => handleClick(e, item)}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[0.65rem] transition-colors',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-accent-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                <span className="leading-none">{t(item.key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}