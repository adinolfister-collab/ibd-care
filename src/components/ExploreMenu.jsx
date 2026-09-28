import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import SiteMenu from '@/components/SiteMenu';
import GuestPreviewToggle from '@/components/GuestPreviewToggle';
import { useI18n } from '@/lib/i18n';

// Bottone "Esplora" nella top nav: apre il blocco Esplora la rivista in un
// pannello sovrapposto (Sheet dall'alto). Si chiude automaticamente al
// cambio rotta. Il blocco in fondo al contenuto resta sempre visibile via AppLayout.
export default function ExploreMenu() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const title = t('home.explore_title') || 'Esplora la rivista';
  const desc = t('home.explore_desc') || "Tutte le sezioni dell'app, a portata di tap.";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={title}
        className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full text-foreground hover:bg-accent transition-colors shrink-0"
      >
        <Compass className="w-4 h-4 text-terracotta" />
        <span className="text-sm font-medium hidden sm:inline">{title}</span>
      </button>
      <SheetContent side="top" className="max-h-[85vh] overflow-y-auto p-4">
        <SheetTitle className="sr-only">{title}</SheetTitle>
        <p className="text-sm text-muted-foreground mb-3">{desc}</p>
        <SiteMenu />
        <div className="mt-6">
          <GuestPreviewToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}