import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';
import SubscriptionCard from '@/components/SubscriptionCard';
import LoginSubscriptionPromo from '@/components/LoginSubscriptionPromo';

// Public subscription page. Serves as the redirect target when a visitor
// tries to use a protected page without being logged in / subscribed.
export default function Abbonamento() {
  const { t } = useI18n();
  const { isAuthenticated, isLoadingAuth, authChecked, checkUserAuth } = useAuth();

  useEffect(() => {
    if (!authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, checkUserAuth]);

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-primary items-center justify-center mb-3">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">IBD Care Premium</h1>
          <p className="text-muted-foreground mt-1.5">14 giorni gratuiti, poi €2,99/mese. Disdici quando vuoi.</p>
        </div>

        {isAuthenticated ? (
          <SubscriptionCard />
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <LoginSubscriptionPromo returnTo="/" />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Hai già un account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">Accedi</Link>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:underline">← Torna alla home</Link>
        </p>
        <div className="mt-6 flex justify-center gap-5 text-sm text-muted-foreground">
          <Link to="/about" className="hover:text-primary hover:underline">Chi siamo</Link>
          <Link to="/contact" className="hover:text-primary hover:underline">Contatti</Link>
        </div>
      </div>
    </div>
  );
}