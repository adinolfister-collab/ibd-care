import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Pulsante "Torna su" fluttuante: compare dopo aver scrollato la pagina,
// invia in cima con scorrimento fluido. Posizionato sopra la bottom tab bar
// su mobile (safe-area aware) e in basso a destra su desktop.
export default function ScrollToTopButton() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('common.back_to_top')}
      title={t('common.back_to_top')}
      className={cn(
        'fixed right-4 z-40 flex items-center justify-center',
        'w-11 h-11 rounded-full shadow-lg',
        'bg-primary text-primary-foreground hover:bg-primary/90 transition-all',
        'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6'
      )}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}