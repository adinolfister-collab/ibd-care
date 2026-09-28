import { useEffect, useRef } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useGuestPreview } from '@/lib/GuestPreviewContext';
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
  const { isGuestPreview } = useGuestPreview();
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

  // Anteprima ospite admin: le route protette (account, impostazioni, admin)
  // sono inaccessibili durante l'anteprima. Reindirizza alla home pubblica
  // anziché al login, dato che la sessione admin è ancora attiva.
  if (isGuestPreview) {
    return <Navigate to="/" replace />;
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