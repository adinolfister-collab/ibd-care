import React from 'react';
import { Plus, Pill, Clock, CalendarDays } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { medItems } from '@/lib/screenshotSampleData';

const typeColors = {
  farmaco_orale: 'bg-sky-50 text-sky-600',
  iniezione: 'bg-violet-50 text-violet-600',
  biologico: 'bg-emerald-50 text-emerald-600',
  integratore: 'bg-amber-50 text-amber-600',
};
const typeLabel = { farmaco_orale: 'Farmaco orale', iniezione: 'Iniezione', biologico: 'Biologico', integratore: 'Integratore' };
const freqLabel = { giornaliero: 'Ogni giorno', settimanale: 'Ogni settimana', occasionale: 'Al bisogno' };

export default function MedsFrame() {
  return (
    <div className="h-full overflow-y-auto px-3 pb-4">
      <div className="flex justify-end gap-2 mb-2">
        <Button variant="outline" className="rounded-xl h-8 px-3 text-xs"><CalendarDays className="w-3.5 h-3.5 mr-1" />Calendario</Button>
        <Button className="rounded-xl h-8 px-3 text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Aggiungi</Button>
      </div>
      <div className="space-y-2.5">
        {medItems.map((m) => (
          <Card key={m.id} className="border-0 shadow-sm">
            <CardContent className="p-3.5">
              <div className="flex items-start gap-2.5">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', typeColors[m.type] || 'bg-accent')}>
                  <Pill className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm leading-tight">{m.name}</p>
                  <p className="text-[0.65rem] text-muted-foreground">{typeLabel[m.type]}{m.dosage ? ' · ' + m.dosage : ''}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[0.65rem]">
                    <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" />{m.times}</span>
                    <span className="text-muted-foreground">· {freqLabel[m.frequency] || m.frequency}</span>
                    {m.active && <span className="text-[0.6rem] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium ml-auto">Attivo</span>}
                  </div>
                  {m.notes && <p className="text-[0.65rem] text-muted-foreground mt-1.5">{m.notes}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}