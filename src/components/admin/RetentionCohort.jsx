import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

// Coorte di retention a 1/2/4 settimane dalla registrazione.
export default function RetentionCohort({ retention, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-5 h-40 animate-pulse" />
      </Card>
    );
  }

  const cohorts = retention?.cohorts || [];

  return (
    <Card className="border-0 shadow-sm mb-6">
      <CardContent className="p-5">
        <h2 className="font-heading text-lg font-semibold mb-1 flex items-center gap-2">
          <Users className="w-4 h-4 text-terracotta" />
          Retention
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Quanti utenti tornano a usare l'app a 1, 2 e 4 settimane dalla registrazione.
        </p>

        {!retention?.available ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Dati di retention ancora insufficienti: servono utenti registrati da almeno 1 settimana.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 px-2 font-medium">Coorte</th>
                  <th className="py-2 px-2 font-medium text-right">Iscritti</th>
                  <th className="py-2 px-2 font-medium text-right">Sett. 1</th>
                  <th className="py-2 px-2 font-medium text-right">Sett. 2</th>
                  <th className="py-2 px-2 font-medium text-right">Sett. 4</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.weekOffset} className="border-b border-border last:border-0">
                    <td className="py-2 px-2 font-medium">{c.weekLabel}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{c.registered}</td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {c.w1 !== null ? `${c.w1} (${c.w1pct}%)` : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {c.w2 !== null ? `${c.w2} (${c.w2pct}%)` : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {c.w4 !== null ? `${c.w4} (${c.w4pct}%)` : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {retention?.note && (
          <p className="text-[0.65rem] text-muted-foreground mt-3">{retention.note}</p>
        )}
      </CardContent>
    </Card>
  );
}