import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Gate for data-recording actions on public pages. Anonymous visitors are
// redirected to /register with a returnTo pointing back to the current page
// instead of saving locally. Returns true only when the action may proceed
// (user is authenticated). While auth is still resolving it blocks silently.
export function useRegisterGate() {
  const { isAuthenticated, authChecked } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    if (!authChecked) return false;
    if (!isAuthenticated) {
      navigate(`/register?returnTo=${encodeURIComponent(location.pathname)}`);
      return false;
    }
    return true;
  }, [authChecked, isAuthenticated, navigate, location.pathname]);
}