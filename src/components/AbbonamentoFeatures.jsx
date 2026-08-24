import React from 'react';
import { Check, Crown } from 'lucide-react';
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from '@/components/ui/accordion';

const FREE_FEATURES = [
  { name: 'News IBD', desc: 'Articoli e aggiornamenti sulla patologia.' },
  { name: 'Diario sintomi', desc: 'Registra i sintomi e rivedi lo storico degli ultimi 30 giorni.' },
  { name: 'Diario alimentare', desc: 'Annota pasti e reazioni e consulta lo storico degli ultimi 30 giorni.' },
  { name: 'Community', desc: 'Partecipa alle discussioni con la community.' },
  { name: 'Account e impostazioni', desc: 'Gestione profilo, lingua e preferenze.' },
];

const PREMIUM_FEATURES = [
  { name: 'Storico completo', desc: 'Visualizzazione dello storico senza limiti di tempo, oltre i 30 giorni, per sintomi e alimentazione.' },
  { name: 'Terapie', desc: 'Gestione farmaci e promemoria di assunzione.' },
  { name: 'Referti medici', desc: 'Archivio sicuro dei tuoi documenti clinici.' },
  { name: 'Esami', desc: 'Scansione e confronto dei referti nel tempo.' },
  { name: 'Andamento & grafici', desc: "Grafici dei sintomi e decorso dell'anno." },
  { name: 'Correlazione pasti-sintomi', desc: 'Analisi automatica dei legami tra alimentazione e sintomi.' },
  { name: 'Report settimanale e mensile', desc: 'Sintesi periodiche pronte per la visita.' },
  { name: 'Riepilogo & export PDF', desc: 'Report personalizzati per la visita specialistica.' },
  { name: 'Assistente AI', desc: 'Supporto personalizzato e risposte sull\'IBD.' },
  { name: 'Mappa servizi', desc: 'Centri IBD, farmacie e bagni nelle vicinanze.' },
  { name: 'Modelli pasti e suggerimenti', desc: 'Template alimentari e consigli alimentari premium.' },
];

function Column({ title, tone, features }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-border ${tone === 'premium' ? 'bg-terracotta/10' : 'bg-accent/40'}`}>
        {tone === 'premium' ? <Crown className="w-4 h-4 text-terracotta" /> : <Check className="w-4 h-4 text-primary" />}
        <h3 className="font-heading font-semibold text-foreground text-sm md:text-base">{title}</h3>
      </div>
      <Accordion type="single" collapsible defaultValue="item-0">
        {features.map((f, i) => (
          <AccordionItem key={f.name} value={`item-${i}`} className="border-b border-border last:border-0">
            <AccordionTrigger className="px-4 text-sm font-medium hover:no-underline">{f.name}</AccordionTrigger>
            <AccordionContent className="px-4 text-sm text-muted-foreground leading-relaxed">{f.desc}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// Due colonne a menu a tendina (accordion) che descrivono cosa è incluso
// nella registrazione gratuita e cosa richiede l'abbonamento Premium.
export default function AbbonamentoFeatures() {
  return (
    <div className="my-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-2 h-8 w-1.5 rounded-full bg-terracotta shrink-0" />
        <div>
          <p className="font-heading text-lg font-semibold text-primary">Cosa include</p>
          <p className="text-sm text-muted-foreground">Confronto tra registrazione gratuita e abbonamento Premium.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Column title="Con registrazione gratuita" tone="free" features={FREE_FEATURES} />
        <Column title="Con abbonamento Premium" tone="premium" features={PREMIUM_FEATURES} />
      </div>
    </div>
  );
}