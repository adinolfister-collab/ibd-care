import React from 'react';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { severityLabelKey, severityColor } from '@/lib/clinicalIndices';
import { localeForLang } from '@/lib/enumLabels';
import EmptyState from '@/components/EmptyState';
import { Trash2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// Storico delle registrazioni degli indici clinici, filtrabile per tipo.
export default function ClinicalIndexHistory({ items, filter, onDelete, lang }) {
  const { t } = useI18n();
  const filtered = filter === 'all' ? items : items.filter((i) => i.index_type === filter);
  const fmtDate = (d) => {
    try { return new Date(d).toLocaleDateString(localeForLang(lang), { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; }
  };
  return (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <EmptyState icon={Activity} title={t('clinical.no_history')} description={t('clinical.no_history_desc')} />
      ) : (
        filtered.map((it) => {
          const color = severityColor(it.severity_label);
          const name = it.index_type === 'hbi' ? t('clinical.hbi_name') : t('clinical.mayo_name');
          return (
            <Card key={it.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <span className="text-2xl font-bold font-heading" style={{ color }}>{it.score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-muted-foreground">{fmtDate(it.entry_date)}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-white shrink-0" style={{ background: color }}>
                  {t(severityLabelKey(it.severity_label))}
                </span>
                <button onClick={() => onDelete(it.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}