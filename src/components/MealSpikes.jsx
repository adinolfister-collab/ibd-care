import React from 'react';
import { Utensils, Activity, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const R_TONE = { nessuna: 'text-emerald-600', lieve: 'text-amber-600', moderata: 'text-orange-600', severa: 'text-rose-500' };
const R_LABEL = { nessuna: 'Nessuna', lieve: 'Lieve', moderata: 'Moderata', severa: 'Severa' };
const MEAL_LABEL = { colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena', spuntino: 'Spuntino' };

function SymBadge({ label, val, spike }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', spike ? 'bg-rose-100 text-rose-700' : 'bg-accent text-accent-foreground')}>
      {label}: {val}
      {spike && <Activity className="w-3 h-3" />}
    </span>
  );
}

function MealsBlock({ title, meals }) {
  return (
    <div className="rounded-lg bg-card border border-border p-3">
      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
        <Utensils className="w-3.5 h-3.5" />
        {title}
      </p>
      {meals.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Nessun pasto registrato</p>
      ) : (
        <div className="space-y-2">
          {meals.map((m, i) => (
            <div key={i} className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{MEAL_LABEL[m.meal_type] || m.meal_type || '—'}</span>
                {m.reaction && <span className={cn('font-medium', R_TONE[m.reaction])}>· {R_LABEL[m.reaction] || m.reaction}</span>}
              </div>
              <p className="text-muted-foreground leading-snug">{m.foods}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MealSpikes({ series }) {
  const spikes = [];
  series.forEach((d, i) => {
    const isSpike = (d.pain != null && d.pain >= 5) || (d.fatigue != null && d.fatigue >= 5) || (d.bowel != null && d.bowel >= 5);
    if (!isSpike) return;
    const prev = i > 0 ? series[i - 1] : null;
    spikes.push({ d, prev });
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-500" />
          Pasti e picchi di malessere
        </CardTitle>
        <CardDescription>
          Giorni con picchi di dolore, stanchezza o scariche, affiancati ai pasti registrati il giorno del picco e quello precedente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {spikes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun picco di malessere rilevato nel periodo selezionato.</p>
        ) : (
          <div className="space-y-4">
            {spikes.map(({ d, prev }, idx) => (
              <div key={idx} className="rounded-xl border border-border p-4 bg-muted/30">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-semibold text-sm">{d.date}</span>
                  {d.pain != null && <SymBadge label="Dolore" val={d.pain} spike={d.pain >= 5} />}
                  {d.fatigue != null && <SymBadge label="Stanchezza" val={d.fatigue} spike={d.fatigue >= 5} />}
                  {d.bowel != null && <SymBadge label="Scariche" val={d.bowel} spike={d.bowel >= 5} />}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <MealsBlock title="Giorno precedente" meals={prev?.meals || []} />
                  <MealsBlock title="Giorno del picco" meals={d.meals || []} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}