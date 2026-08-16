import React from 'react';
import { Salad, Check, X, Info, Apple, Wheat, Milk, Coffee, ChefHat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const tolerated = [
  { icon: Wheat, text: 'Riso, patate e cereali raffinati (pane bianco, pasta)' },
  { icon: Apple, text: 'Mele e pere sbucciate o cotte, banane mature' },
  { icon: Salad, text: 'Verdure ben cotte: zucchine, carote, zucca, finocchi lessi' },
  { icon: ChefHat, text: 'Carni magre (pollo, tacchino), pesce bianco, uova' },
  { icon: Milk, text: 'Yogurt senza lattosio o formaggi stagionati in piccole quantità' },
  { icon: Wheat, text: 'Avena e fiocchi d\'avena tollerati da molti' },
];

const discouraged = [
  { icon: X, text: 'Cibi molto piccanti o speziati' },
  { icon: X, text: 'Fritti egrassi animali in eccesso' },
  { icon: X, text: 'Latticini interi se intollerante al lattosio' },
  { icon: X, text: 'Legumi e verdure crude fibrose (cavoli, broccoli, cipolle)' },
  { icon: X, text: 'Frutta secca, semi e bucce di frutta/verdura' },
  { icon: Coffee, text: 'Alcol, caffè e bevande gassate o energizzanti' },
  { icon: X, text: 'Cibi ultraprocessati e ricchi di zuccheri aggiunti' },
];

const tips = [
  'Mangia pasti piccoli e frequenti invece di pasti abbondanti.',
  'Mastica lentamente e beve durante i pasti a piccoli sorsi.',
  'Tieni un diario alimentare per individuare i tuoi trigger personali.',
  'Durante le riacutizzazioni preferisci diete a basso residuo fibra.',
];

export default function DietaryTips() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="diet" className="border rounded-xl px-4 bg-card shadow-sm">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex items-center gap-2.5 text-left">
            <Salad className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Suggerimenti alimentari per l'IBD</p>
              <p className="text-xs text-muted-foreground font-normal">Cibi generalmente tollerati o sconsigliati</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-1">
          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="border-0 bg-emerald-50/60">
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 font-medium text-emerald-700 mb-3 text-sm">
                  <Check className="w-4 h-4" /> Spesso tollerati
                </p>
                <ul className="space-y-2.5">
                  {tolerated.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                      <f.icon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="select-text">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-0 bg-rose-50/60">
              <CardContent className="p-4">
                <p className="flex items-center gap-1.5 font-medium text-rose-700 mb-3 text-sm">
                  <X className="w-4 h-4" /> Generalmente sconsigliati
                </p>
                <ul className="space-y-2.5">
                  {discouraged.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                      <f.icon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="select-text">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl bg-accent/60 p-4">
            <p className="flex items-center gap-1.5 font-medium text-foreground mb-2 text-sm">
              <Info className="w-4 h-4 text-primary" /> Consigli pratici
            </p>
            <ul className="space-y-1.5 list-disc pl-5">
              {tips.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground select-text">{tip}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed select-text">
            Queste indicazioni sono di carattere generale e non sostituiscono il parere del tuo medico o di un dietista. La tolleranza alimentare varia da persona a persona: usa il tuo diario per individuare i trigger personali.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}