import React from 'react';
import { Eye } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useGuestPreview } from '@/lib/GuestPreviewContext';

// Pulsante "Anteprima ospite" visibile solo agli admin e solo quando non
// si è già in anteprima (durante l'anteprima il banner offre l'uscita).
// Mostrato nel pannello Esplora. Inizia la modalità anteprima ospite.
export default function GuestPreviewToggle() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { isGuestPreview, enterGuestPreview } = useGuestPreview();

  if (user?.role !== 'admin' || isGuestPreview) return null;

  return (
    <button
      type="button"
      onClick={enterGuestPreview}
      className="w-full flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 px-4 py-3 transition-colors"
    >
      <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Eye className="w-5 h-5 text-primary" />
      </span>
      <span className="flex-1 text-left">
        <span className="block font-heading text-base font-medium tracking-tight text-foreground">{t('guest.preview_toggle')}</span>
        <span className="block text-xs text-muted-foreground leading-snug">{t('guest.preview_toggle_desc')}</span>
      </span>
    </button>
  );
}