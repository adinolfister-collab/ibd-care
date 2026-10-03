import React from 'react';
import { Activity, Utensils, FileBarChart, MapPin, Pill, Plus, Calendar } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { themeImage } from '@/lib/themeImages';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { todaySymptom, quickActions, homeMeds, homeRecent } from '@/lib/screenshotSampleData';

const ICONS = { Activity, Utensils, FileBarChart, MapPin };

function Stat({ label, value, tone }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-semibold mt-0.5', tone)}>{value}</p>
    </div>
  );
}
function tone(v) {
  if (v == null) return '';
  if (v >= 7) return 'text-rose-500';
  if (v >= 4) return 'text-amber-600';
  return 'text-emerald-600';
}

export default function HomeFrame() {
  return (
    <div className="h-full overflow-y-auto px-3 pb-4">
      {/* Masthead */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <Image src={themeImage('serena')} fittingType="fill" alt="" className="w-full h-24 block" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/50 to-primary/15" />
        <div className="absolute inset-0 p-3 flex flex-col justify-end">
          <p className="text-[0.55rem] font-heading font-semibold uppercase tracking-[0.22em] text-primary-foreground/85">
            IBD Care · Rivista mediterranea
          </p>
          <h1 className="mt-1 font-heading text-lg font-semibold text-primary-foreground leading-tight">
            Bentornato, Marco 👋
          </h1>
        </div>
      </div>

      {/* Stato di oggi */}
      <Card className="border-0 shadow-sm mt-3 bg-gradient-to-br from-primary/5 to-accent/40">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Dolore" value={`${todaySymptom.pain_level}/10`} tone={tone(todaySymptom.pain_level)} />
            <Stat label="Stanchezza" value={`${todaySymptom.fatigue_level}/10`} tone={tone(todaySymptom.fatigue_level)} />
            <Stat label="Scariche" value={todaySymptom.bowel_movements_count} />
            <Stat label="Bristol" value={`Tipo ${todaySymptom.stool_consistency}`} />
          </div>
        </CardContent>
      </Card>

      {/* Accesso rapido */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {quickActions.map((a) => {
          const Icon = ICONS[a.icon];
          return (
            <div key={a.key} className="rounded-xl border border-border bg-card p-2 flex flex-col gap-1.5 items-center text-center">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', a.bg)}>
                <Icon className={cn('w-4 h-4', a.color)} />
              </div>
              <span className="text-[0.6rem] font-medium leading-tight">{a.key}</span>
            </div>
          );
        })}
      </div>

      {/* Promemoria terapie */}
      <Card className="border border-border shadow-sm bg-card mt-3">
        <CardContent className="p-3">
          <p className="text-xs font-heading font-semibold uppercase tracking-wide text-muted-foreground mb-2">Promemoria terapie</p>
          <ul className="divide-y divide-border">
            {homeMeds.map((m) => (
              <li key={m.name} className="py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium leading-tight">{m.name}</p>
                  <p className="text-[0.65rem] text-muted-foreground">{m.dosage}</p>
                </div>
                <span className="text-xs font-medium text-primary whitespace-nowrap">{m.times.split(',')[0]}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Registrazioni recenti */}
      <Card className="border border-border shadow-sm bg-card mt-3">
        <CardContent className="p-3">
          <p className="text-xs font-heading font-semibold uppercase tracking-wide text-muted-foreground mb-2">Registrazioni recenti</p>
          <ul className="divide-y divide-border">
            {homeRecent.map((r, i) => (
              <li key={i} className="py-2 flex items-center gap-2">
                {r.kind === 'symptom' ? <Activity className="w-4 h-4 text-rose-400" /> : <Utensils className="w-4 h-4 text-amber-500" />}
                <div>
                  <p className="text-xs font-medium leading-tight">{r.label}</p>
                  <p className="text-[0.6rem] text-muted-foreground">{r.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}