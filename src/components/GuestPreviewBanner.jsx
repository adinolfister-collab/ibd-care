import React from 'react';
import { Eye, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// Banner persistente mostrato in ogni schermata mentre l'admin è in
// "Anteprima ospite". Tono neutro (primary, non allarme), con il pulsante
// per uscire dall'anteprima sempre raggiungibile. Posizionato in fondo,
// sopra la bottom nav mobile (bottom-16) e a fondo pagina su desktop.
export default function GuestPreviewBanner({ onExit }) {
  const { t } = useI18n();
  return (
    <div className="fixed bottom-16 md:bottom-0 inset-x-0 z-[60] px-3 pb-3 pointer-events-none">
      <div className="mx-auto max-w-4xl pointer-events-auto flex items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-primary text-primary-foreground shadow-lg px-4 py-2.5">
        <Eye className="w-4 h-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{t('guest.preview_title')}</p>
          <p className="text-xs text-primary-foreground/80 leading-snug truncate">{t('guest.preview_desc')}</p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground text-xs font-semibold px-3 py-2 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          {t('guest.preview_exit')}
        </button>
      </div>
    </div>
  );
}