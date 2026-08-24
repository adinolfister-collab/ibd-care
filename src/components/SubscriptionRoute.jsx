import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { trackPremiumAttempt } from '@/lib/premiumTracking';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
  </div>
);

// Route guard: allow access only to authenticated AND subscribed users.
// Non-authenticated or non-subscribed visitors are redirected to the
// subscription page (passed via `redirect`).
export default function SubscriptionRoute({ fallback = <DefaultFallback />, redirect }) {
  const { isLoadingAuth, authChecked, isAuthenticated, authError, checkUserAuth } = useAuth();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const location = useLocation();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  // Traccia il tentativo di accesso a una funzione premium da parte di un
  // utente autenticato ma non abbonato, prima del redirect al paywall.
  useEffect(() => {
    if (isAuthenticated && !subLoading && !isSubscribed) {
      trackPremiumAttempt(location.pathname, 'route_guard');
    }
  }, [isAuthenticated, subLoading, isSubscribed, location.pathname]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    return redirect;
  }

  if (!isAuthenticated) {
    return redirect;
  }

  if (subLoading) {
    return fallback;
  }

  if (!isSubscribed) {
    return redirect;
  }

  return <Outlet />;
}