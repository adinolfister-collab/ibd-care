import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { themeImage } from '@/lib/themeImages';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { mapLocations } from '@/lib/screenshotSampleData';

const typeBg = {
  centro_ibd: 'bg-emerald-50 text-emerald-700',
  bagno_pubblico: 'bg-sky-50 text-sky-700',
  farmacia: 'bg-amber-50 text-amber-700',
  pronto_soccorso: 'bg-rose-50 text-rose-700',
};
const typeLabel = {
  centro_ibd: 'Centro IBD',
  bagno_pubblico: 'Bagno pubblico',
  farmacia: 'Farmacia',
  pronto_soccorso: 'Pronto soccorso',
};

export default function MapFrame() {
  return (
    <div className="h-full overflow-y-auto px-3 pb-4">
      {/* Mini-mappa stilizzata con pin */}
      <div className="relative overflow-hidden rounded-2xl border border-border mb-2.5 h-40">
        <Image src={themeImage('mappa')} fittingType="fill" alt="" className="w-full h-full block" />
        <div className="absolute inset-0 bg-primary/20" />
        {/* Pin campione */}
        <span className="absolute top-6 left-8 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white shadow" />
        <span className="absolute top-12 right-10 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white shadow" />
        <span className="absolute bottom-10 left-14 w-3 h-3 rounded-full bg-sky-500 ring-2 ring-white shadow" />
        <span className="absolute bottom-6 right-6 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white shadow" />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[0.6rem] font-medium text-primary px-2 py-1 rounded-full bg-primary/10 bg-white/80">
          <Navigation className="w-3 h-3" /> La mia posizione
        </span>
      </div>

      <div className="space-y-2">
        {mapLocations.map((loc) => (
          <Card key={loc.id} className="border border-border shadow-sm">
            <CardContent className="p-2.5 flex items-start gap-2">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', typeBg[loc.type])}>
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs leading-snug">{loc.name}</p>
                <p className="text-[0.6rem] text-muted-foreground mt-0.5">{typeLabel[loc.type]}</p>
                <p className="text-[0.6rem] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  {[loc.city, loc.region].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="text-[0.6rem] font-medium text-primary whitespace-nowrap inline-flex items-center gap-1 shrink-0">
                <Navigation className="w-3 h-3" /> Indicazioni
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}