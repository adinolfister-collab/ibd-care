import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

// Cluster in alto a destra: Login per gli ospiti, Logout per gli autenticati.
export default function TopRightActions() {
  const { isAuthenticated, authChecked } = useAuth();
  const { t } = useI18n();

  if (!authChecked) {
    // Riserva spazio per evitare salti di layout finché l'auth si risolve.
    return <div className="h-9 w-9" />;
  }

  if (isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => base44.auth.logout('/')}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-border bg-card text-foreground text-sm font-medium hover:bg-accent transition-colors shrink-0"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">{t('settings.logout')}</span>
      </button>
    );
  }

  return (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
    >
      <LogIn className="w-4 h-4" />
      <span className="hidden sm:inline">{t('auth.login_btn')}</span>
    </Link>
  );
}