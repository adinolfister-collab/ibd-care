import React from 'react';
import { Info } from 'lucide-react';
import PublicFooter from '@/components/PublicFooter';

export default function About() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Info className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Chi siamo</h1>
        </div>

        <div className="prose max-w-none select-text text-foreground/90 leading-relaxed space-y-4">
          <p>
            <strong>IBD Care</strong> è un'applicazione dedicata alle persone che vivono con
            le malattie infiammatorie croniche intestinali (IBD), come il morbo di Crohn e la
            colite ulcerosa. L'app nasce dall'esigenza concreta di avere uno strumento calmo,
            affidabile e riservato per monitorare quotidianamente l'andamento della propria
            salute, dialogare meglio con il proprio team medico e ritrovare un senso di
            controllo su una condizione spesso imprevedibile.
          </p>
          <p>
            L'app offre un diario dei sintomi e dell'alimentazione, la gestione dei farmaci e
            dei promemoria terapeutici, l'archiviazione sicura dei referti medici, l'analisi
            dei trend con supporto di un assistente AI, una mappa dei servizi utili (centri
            IBD, farmacie, pronto soccorso e bagni pubblici) e la generazione di riepiloghi in
            PDF pronti per la visita. È pensata per pazienti adulti e per chi se ne prende cura,
            con un'interfaccia chiara, tipografie ampie e una palette rilassante che riduce
            l'affaticamento visivo durante i giorni più difficili.
          </p>
          <p>
            IBD Care è sviluppato da un piccolo team indipendente che unisce competenze
            ingegneristiche e sensibilità per il tema della salute cronica. Crediamo nel
            rispetto della privacy: i dati sanitari restano di proprietà dell'utente, sono
            protetti con critterio a livello di riga (RLS) e trattati in conformità al GDPR.
            Non vendiamo dati a terzi e non mostriamo pubblicità: la sostenibilità del progetto
            è garantita da un abbonamento trasparente, con una prova gratuita di 14 giorni.
          </p>
          <p>
            Il nostro impegno è continuo: aggiorniamo l'app ascoltando la community e i
            feedback clinici, per costruire insieme uno strumento che renda ogni giornata un
            po' più semplice.
          </p>
        </div>

        <PublicFooter />
      </div>
    </div>
  );
}