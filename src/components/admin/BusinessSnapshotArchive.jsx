import React from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Tabella archivio snapshot + pulsante "salva snapshot ora".
export default function BusinessSnapshotArchive({ snapshots, onSaveSnapshot, saving, onDelete }) {
  const rows = (snapshots || []).slice(0, 50);

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Archivio snapshot</h2>
            <p className="text-xs text-muted-foreground">{rows.length} snapshot salvati · uno al giorno dal workflow + manuali</p>
          </div>
          <Button onClick={onSaveSnapshot} disabled={saving} className="rounded-xl">
            <Camera className="w-4 h-4 mr-1.5" />
            {saving ? 'Salvataggio…' : 'Salva snapshot ora'}
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Nessuno snapshot archiviato. Premi "Salva snapshot ora" per il primo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 px-2 font-medium">Data</th>
                  <th className="py-2 px-2 font-medium text-center">Origine</th>
                  <th className="py-2 px-2 font-medium text-right">Premium</th>
                  <th className="py-2 px-2 font-medium text-right">Trial</th>
                  <th className="py-2 px-2 font-medium text-right">Demo</th>
                  <th className="py-2 px-2 font-medium text-right">% Cary</th>
                  <th className="py-2 px-2 font-medium text-right">Ricavi</th>
                  <th className="py-2 px-2 font-medium text-right">Margine</th>
                  <th className="py-2 px-2 font-medium text-right">Piano</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-accent/40">
                    <td className="py-2 px-2 font-medium whitespace-nowrap">{s.snapshot_date}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={cn('text-[0.65rem] px-1.5 py-0.5 rounded-full', s.source === 'manual' ? 'bg-terracotta/15 text-terracotta' : 'bg-accent text-muted-foreground')}>
                        {s.source === 'manual' ? 'manuale' : 'giorno'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.premium_users || 0}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.trial_users || 0}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.demo_users || 0}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.cary_adoption_pct || 0}%</td>
                    <td className="py-2 px-2 text-right tabular-nums">${(s.estimated_monthly_revenue || 0).toFixed(2)}</td>
                    <td className={cn('py-2 px-2 text-right tabular-nums font-medium', (s.estimated_margin || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      ${(s.estimated_margin || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right text-xs text-muted-foreground">{s.base44_plan}</td>
                    <td className="py-2 px-2 text-right">
                      <button onClick={() => onDelete(s.id)} className="text-muted-foreground hover:text-rose-600 transition-colors" aria-label="Elimina snapshot">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}