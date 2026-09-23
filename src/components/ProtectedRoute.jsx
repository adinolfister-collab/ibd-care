import { useEffect, useRef } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';
import { toast } from '@/components/ui/use-toast';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement, requireRole }) {
  const { isAuthenticated, isLoadingAuth, authChecked, authError, user, checkUserAuth } = useAuth();
  const { t } = useI18n();
  const deniedRef = useRef(false);

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    return unauthenticatedElement;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  if (requireRole && user?.role !== requireRole) {
    if (!deniedRef.current) {
      deniedRef.current = true;
      toast({ title: t('admin.denied') });
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}