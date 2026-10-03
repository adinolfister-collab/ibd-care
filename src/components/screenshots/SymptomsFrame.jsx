import React from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { symptomItems } from '@/lib/screenshotSampleData';

function Mini({ label, value, tone }) {
  return (
    <div className="bg-accent/50 rounded-lg p-2">
      <p className="text-[0.6rem] text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-semibold mt-0.5', tone)}>{value}</p>
    </div>
  );
}
function tone(v) { if (v == null) return ''; if (v >= 7) return 'text-rose-500'; if (v >= 4) return 'text-amber-600'; return 'text-emerald-600'; }

const IT_DATE = (d) => {
  try { return new Date(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return d; }
};

export default function SymptomsFrame() {
  return (
    <div className="h-full overflow-y-auto px-3 pb-4">
      <div className="flex justify-end mb-2">
        <Button className="rounded-xl h-8 px-3 text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Aggiungi</Button>
      </div>
      <div className="space-y-2.5">
        {symptomItems.map((it) => (
          <Card key={it.id} className="border-0 shadow-sm">
            <CardContent className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm capitalize">{IT_DATE(it.entry_date)}</p>
                  {it.blood && <span className="inline-block mt-1 text-[0.6rem] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">Sangue presente</span>}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2.5">
                <Mini label="Dolore" value={`${it.pain_level ?? 0}/10`} tone={tone(it.pain_level)} />
                <Mini label="Stanchezza" value={`${it.fatigue_level ?? 0}/10`} tone={tone(it.fatigue_level)} />
                <Mini label="Scariche" value={it.bowel_movements_count ?? 0} />
                <Mini label="Bristol" value={it.stool_consistency ?? '—'} />
              </div>
              {it.notes && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{it.notes}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}