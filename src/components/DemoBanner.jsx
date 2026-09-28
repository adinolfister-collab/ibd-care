import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { clearAllGuestEntries } from '@/lib/guestEntries';

// Banner mostrato in cima alle pagine diario ai visitatori non autenticati
// (modalità demo). Avvisa esplicitamente che i dati restano sul dispositivo e
// non sono reali, invita a registrarsi per la prova di 30 giorni e offre un
// pulsante "Azzera demo" per ripartire da zero. `onReset` (opzionale) viene
// chiamato dopo la pulizia per ricaricare i dati della pagina.
export default function DemoBanner({ className = '', onReset }) {
  const { t } = useI18n();
  const handleReset = () => {
    clearAllGuestEntries();
    onReset?.();
  };
  return (
    <div className={`mb-4 rounded-xl border border-terracotta/30 bg-terracotta/[0.06] px-4 py-3 ${className}`}>
      <div className="flex items-center gap-3">
        <Eye className="w-4 h-4 text-terracotta shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{t('demo.mode_title')}</p>
          <p className="text-xs text-muted-foreground leading-snug">{t('demo.mode_desc')}</p>
        </div>
        <Link
          to="/register"
          className="shrink-0 rounded-lg bg-terracotta text-terracotta-foreground text-xs font-semibold px-3 py-2 hover:bg-terracotta/90 transition-colors"
        >
          {t('demo.cta_trial')}
        </Link>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-terracotta/15">
        <p className="text-[11px] text-muted-foreground leading-snug pr-2">{t('demo.mode_hint')}</p>
        <button
          onClick={handleReset}
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-terracotta hover:underline"
        >
          <RotateCcw className="w-3 h-3" /> {t('demo.reset')}
        </button>
      </div>
    </div>
  );
}