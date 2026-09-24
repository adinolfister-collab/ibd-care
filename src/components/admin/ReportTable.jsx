import React from 'react';
import { cn } from '@/lib/utils';

// Tabella generica per le classifiche Analytics (pagine, provenienza, paesi,
// dispositivi): colonna label, contatore e barra di distribuzione calcolata
// rispetto al totale passato.
export default function ReportTable({ rows, total, emptyText, barColor = 'bg-terracotta' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
        {emptyText || 'Nessun dato.'}
      </div>
    );
  }
  const base = total > 0 ? total : Math.max(1, ...rows.map((r) => r.views || r.sessions || 0));
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-muted-foreground border-b border-border">
          <th className="py-2 font-medium">Voce</th>
          <th className="py-2 font-medium text-right">View</th>
          <th className="py-2 font-medium text-right">Sessioni</th>
          <th className="py-2 font-medium w-24">Quota</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const v = r.views || r.sessions || 0;
          const pct = base > 0 ? Math.round((v / base) * 100) : 0;
          return (
            <tr key={r.key} className="border-b border-border last:border-0">
              <td className="py-2.5 truncate max-w-[14rem] font-medium" title={r.key}>{r.key}</td>
              <td className="py-2.5 text-right tabular-nums">{r.views || 0}</td>
              <td className="py-2.5 text-right tabular-nums text-muted-foreground">{r.sessions || 0}</td>
              <td className="py-2.5">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', barColor)}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}