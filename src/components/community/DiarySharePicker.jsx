import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Activity, UtensilsCrossed, Pill, FileText, X } from 'lucide-react';
import { buildEntrySummary, formatDate } from './helpers';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'symptom', icon: Activity, entity: 'SymptomEntry' },
  { key: 'meal', icon: UtensilsCrossed, entity: 'FoodEntry' },
  { key: 'med', icon: Pill, entity: 'Medication' },
  { key: 'exam', icon: FileText, entity: 'MedicalRecord' },
];

// Modale per allegare una propria registrazione del diario a un messaggio.
// Carica le registrazioni recenti dell'utente (RLS created_by_id) e restituisce
// un {type, id, summary} anonimizzato.
export default function DiarySharePicker({ open, onClose, onPick }) {
  const { t } = useI18n();
  const [tab, setTab] = useState('symptom');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cfg = TABS.find((x) => x.key === tab);
    setLoading(true);
    (async () => {
      try {
        const data = await base44.entities[cfg.entity].list('-created_date', 8);
        setItems(data);
      } catch (e) { setItems([]); }
      setLoading(false);
    })();
  }, [open, tab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-heading font-semibold text-base">{t('community.share_title')}</p>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-1 p-2 border-b border-border overflow-x-auto">
          {TABS.map((x) => {
            const Icon = x.icon;
            return (
              <button
                key={x.key}
                type="button"
                onClick={() => setTab(x.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                  tab === x.key ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t('community.share_' + x.key)}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('common.loading')}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('community.share_none')}</p>
          ) : (
            <div className="space-y-2">
              {items.map((entry) => {
                const summary = buildEntrySummary(tab, entry);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onPick({ type: tab, id: entry.id, summary })}
                    className="w-full text-left rounded-xl border border-border bg-background p-3 hover:border-primary/40 hover:bg-accent/40 transition-colors"
                  >
                    <p className="text-sm font-medium">{formatDate(entry.entry_date || entry.record_date || entry.start_date || entry.created_date)}</p>
                    {summary && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{summary}</p>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}