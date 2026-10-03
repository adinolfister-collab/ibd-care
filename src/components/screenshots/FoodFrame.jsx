import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TriggerLightBadge from '@/components/TriggerLightBadge';
import { cn } from '@/lib/utils';
import { foodItems, toleranceLight } from '@/lib/screenshotSampleData';

const MEAL_LABEL = { colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena', spuntino: 'Spuntino' };
const UNIT_LABEL = { g: 'g', ml: 'ml', porzione: '', cucchiaio: ' cucchiai', tazza: ' tazze', fetta: ' fette' };
const reactionTone = { nessuna: 'text-emerald-600', lieve: 'text-amber-600', moderata: 'text-orange-600', severa: 'text-rose-500' };
const reactionLabel = { nessuna: 'Nessuna reazione', lieve: 'Lieve', moderata: 'Moderata', severa: 'Severa' };

export default function FoodFrame() {
  return (
    <div className="h-full overflow-y-auto px-3 pb-4">
      <div className="flex justify-end mb-2">
        <Button className="rounded-xl h-8 px-3 text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Aggiungi pasto</Button>
      </div>

      {/* Semaforo tolleranza */}
      <Card className="border border-border shadow-sm bg-card mb-2.5">
        <CardContent className="p-3">
          <p className="text-xs font-heading font-semibold uppercase tracking-wide text-muted-foreground mb-2">Semaforo tolleranza</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {toleranceLight.map((t) => (
              <div key={t.name} className="flex items-center gap-1.5">
                <TriggerLightBadge status={t.status} />
                <span className="text-xs font-medium leading-tight">{t.name}</span>
                <span className="text-[0.6rem] text-muted-foreground ml-auto">{t.note}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pasti del giorno */}
      <div className="space-y-2.5">
        {foodItems.map((it) => (
          <Card key={it.id} className="border-0 shadow-sm">
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{MEAL_LABEL[it.meal_type] || it.meal_type}</span>
                {it.reaction && <span className={cn('text-[0.65rem] font-medium', reactionTone[it.reaction])}>· {reactionLabel[it.reaction]}</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {it.items.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-terracotta/10 text-accent-foreground text-[0.7rem]">
                    <span className="font-medium">{f.name}</span>
                    {f.qty ? <span className="text-muted-foreground">{f.qty}{UNIT_LABEL[f.unit] || ''}</span> : null}
                  </span>
                ))}
              </div>
              {it.notes && <p className="text-xs text-muted-foreground mt-2">{it.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}