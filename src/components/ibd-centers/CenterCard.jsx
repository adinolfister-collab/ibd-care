import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const typeBg = {
  centro_ibd: 'bg-emerald-50 text-emerald-700',
  bagno_pubblico: 'bg-sky-50 text-sky-700',
  farmacia: 'bg-amber-50 text-amber-700',
  pronto_soccorso: 'bg-rose-50 text-rose-700',
};

export default function CenterCard({ loc, onSelect, selected, typeLabel, t }) {
  return (
    <Card
      onClick={() => onSelect(loc.id)}
      className={cn('border shadow-sm cursor-pointer transition-all', selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/40')}
    >
      <CardContent className="p-3.5 flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', typeBg[loc.type] || 'bg-emerald-50 text-emerald-700')}>
          <MapPin className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">{loc.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{typeLabel(loc.type)}</p>
          {(loc.city || loc.region || loc.country) && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {[loc.city, loc.region, loc.country].filter(Boolean).join(' · ')}
            </p>
          )}
          {loc.address && <p className="text-xs text-muted-foreground mt-0.5">{loc.address}</p>}
        </div>
        {loc.lat && loc.lng && (
          <a
            href={`https://www.openstreetmap.org/directions?from=&to=${loc.lat}%2C${loc.lng}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-primary whitespace-nowrap inline-flex items-center gap-1 shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" /> {t('map.directions')}
          </a>
        )}
      </CardContent>
    </Card>
  );
}