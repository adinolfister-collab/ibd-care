import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, Users, Sparkles, User as UserIcon, LogIn } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/lib/AuthContext';
import { isPremiumRoute } from '@/lib/premiumRoutes';
import PremiumLockBadge from '@/components/PremiumLockBadge';
import { cn } from '@/lib/utils';

// Mobile-only fixed bottom tab bar for the native webview. Hidden on md+
// where the sidebar takes over. Respects the home indicator via safe-area.
//
// Per-tab navigation stacks (capped, FIFO — "per tab attiva" grouping):
// - Each tab keeps its own stack of recently visited paths (max 5).
// - Every navigation is attributed to the "current tab" — the last tab the
//   user selected, or the tab matching the initial route — so even routes
//   that aren't direct children of a tab (e.g. /food, /meds) feed the active
//   tab's stack instead of being discarded.
// - Switching to another tab restores the top of that tab's stack (or its
//   root if the stack is empty); the browser back button still traverses
//   real history entries.
// - Re-tapping the already-active tab resets it to its root, clears its
//   stack and scrolls to the top.
const STACK_LIMIT = 5;

export default function MobileBottomNav({ isAuthenticated }) {
  const { t } = useI18n();
  const { isExpired } = useSubscription();
  const { user } = useAuth();
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

  const tabForPath = (p) =>
    tabs.find((item) =>
      item.exact ? p === item.to : p === item.to || p.startsWith(item.to + '/')
    ) || tabs[0];

  // Per-tab path stacks (mutable, no re-render needed).
  const stacksRef = useRef({});
  // The tab currently "owning" navigation (last selected / initial match).
  const [currentTab, setCurrentTab] = useState(() => tabForPath(location.pathname).to);

  const isTabActive = (item) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(item.to + '/');

  // Track navigation: push the current path onto the active tab's stack
  // (dedup against the top, FIFO cap at STACK_LIMIT). On first mount this
  // seeds the initial tab's stack with the current route.
  useEffect(() => {
    const p = location.pathname;
    const stack = stacksRef.current[currentTab] || (stacksRef.current[currentTab] = []);
    if (stack[stack.length - 1] !== p) {
      stack.push(p);
      if (stack.length > STACK_LIMIT) stack.shift();
    }
  }, [location.pathname, currentTab]);

  const handleClick = (e, item) => {
    e.preventDefault();
    const target = item.to;
    if (currentTab === target) {
      // Re-tap on the active tab: reset to root and clear its stack.
      stacksRef.current[target] = [];
      if (location.pathname !== target) navigate(target);
    } else {
      // Switch tab: restore the top of its stack, or its root.
      setCurrentTab(target);
      const stack = stacksRef.current[target] || [];
      const dest = stack.length > 0 ? stack[stack.length - 1] : target;
      navigate(dest);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around">
        {tabs.map((item) => {
          const isActive = currentTab === item.to || isTabActive(item);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={(e) => handleClick(e, item)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 min-h-[56px] text-[0.65rem] transition-colors',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-accent-foreground'
              )}
            >
              <span className="relative">
                <item.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                {isExpired && isPremiumRoute(item.to) && (
                  <PremiumLockBadge size="nav" className="absolute -top-1 -right-1.5 bg-card rounded-full p-0.5 box-content" />
                )}
              </span>
              <span className="leading-none">{t(item.key)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}