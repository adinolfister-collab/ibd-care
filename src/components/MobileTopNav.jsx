import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, LogIn, HeartPulse, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LanguageChips from '@/components/LanguageChips';
import NativeAppButton from '@/components/NativeAppButton';
import TopRightActions from '@/components/TopRightActions';
import ExploreMenu from '@/components/ExploreMenu';
import ShareMenu from '@/components/ShareMenu';
import TrialBadge from '@/components/TrialBadge';

// Header universale (visibile su tutti i breakpoint): logo/back a sinistra,
// azioni a destra (Esplora, lingua, app nativa, azioni, logout/login).
// Senza più sidebar né toggle vista-desktop. Niente barra di chip: la
// navigazione tra sezioni vive nel blocco "Esplora la rivista" (pannello +
// sezione in fondo al contenuto).
const ROOT_PATHS = ['/', '/symptoms', '/community', '/abbonamento', '/account', '/login'];

export default function MobileTopNav({ isAuthenticated, onLogout }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const isChildScreen = !ROOT_PATHS.includes(location.pathname);

  return (
    <header
      className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-terracotta/50"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between h-12 px-3">
        <div className="flex items-center gap-2 min-w-0">
          {isChildScreen ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-full flex items-center justify-center text-foreground hover:bg-accent transition-colors"
              aria-label={t('common.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/25 to-accent/60 flex items-center justify-center shrink-0">
                <HeartPulse className="w-4 h-4 text-primary" />
              </div>
              <p className="font-heading font-semibold tracking-tight text-sm truncate">{t('app.name')}</p>
              <TrialBadge />
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ExploreMenu />
          <ShareMenu variant="icon" />
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
      <div className="px-3 border-t border-terracotta/30">
        <LanguageChips />
      </div>
    </header>
  );
}