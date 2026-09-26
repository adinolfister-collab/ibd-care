import React, { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import MobileTopNav from '@/components/MobileTopNav';
import MobileBottomNav from '@/components/MobileBottomNav';
import SiteMenu from '@/components/SiteMenu';
import { guestSymptoms, guestFoods, guestRecords, syncGuestEntriesToCloud } from '@/lib/guestEntries';
import { useToast } from '@/components/ui/use-toast';

// Layout mobile-first unico per tutti i breakpoint: header universale in alto,
// bottom tab bar su mobile, contenuto centrato a piena larghezza (nessuna
// sidebar fissa, nessun toggle vista-desktop). Il blocco "Esplora la rivista"
// è la navigazione tra sezioni, sempre presente in fondo al contenuto.
export default function AppLayout({ children }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [syncingGuest, setSyncingGuest] = useState(false);

  // Al primo mount autenticato, migra le registrazioni guest dal dispositivo
  // alle entità cloud dell'utente, poi svuota la cache locale.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!guestSymptoms.has() && !guestFoods.has() && !guestRecords.has()) return;
    let cancelled = false;
    (async () => {
      setSyncingGuest(true);
      try {
        const n = await syncGuestEntriesToCloud();
        if (!cancelled && n > 0) {
          toast({ title: t('guest.synced_title'), description: t('guest.synced_desc') });
        }
      } catch {
        /* keep local entries on failure — user can retry next mount */
      } finally {
        if (!cancelled) setSyncingGuest(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  if (syncingGuest) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t('guest.syncing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MobileTopNav user={user} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <MobileBottomNav isAuthenticated={isAuthenticated} />
      <main className="min-h-screen pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-10 pt-5 md:py-10 pb-28 md:pb-12 max-w-4xl mx-auto">
        {children}
        <SiteMenu />
      </main>
    </div>
  );
}