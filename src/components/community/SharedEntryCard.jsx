import React from 'react';
import { Activity, UtensilsCrossed, Pill, FileText } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const ICONS = {
  symptom: Activity,
  meal: UtensilsCrossed,
  med: Pill,
  exam: FileText,
};

// Scheda riassuntiva di una registrazione del diario allegata a un messaggio.
// Mostra solo il summary testuale: i dettagli clinici restano privati al
// proprietario (RLS created_by_id sulle entita' diario).
export default function SharedEntryCard({ entry }) {
  const { t } = useI18n();
  if (!entry || !entry.type) return null;
  const Icon = ICONS[entry.type] || FileText;
  return (
    <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          {t('community.shared_' + entry.type)}
        </p>
        {entry.summary && (
          <p className="text-sm text-foreground mt-0.5 break-words leading-relaxed">{entry.summary}</p>
        )}
      </div>
    </div>
  );
}