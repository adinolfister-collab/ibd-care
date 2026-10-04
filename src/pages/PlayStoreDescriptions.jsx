import React from 'react';
import PlayStoreTextCard from '@/components/playstore/PlayStoreTextCard';
import { PLAY_STORE_TEXTS } from '@/lib/playStoreTexts';

// Pagina admin: mostra le quattro descrizioni del Google Play Store
// (breve + completa, italiano e inglese) con pulsante Copia per ciascuna.
export default function PlayStoreDescriptions() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Descrizioni per il Play Store
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Testi pronti da incollare nei campi della scheda del Google Play Console.
            Tappa "Copia testo" su una card e incolla nel campo corrispondente.
          </p>
        </header>
        <div className="grid gap-5 sm:grid-cols-2">
          {PLAY_STORE_TEXTS.map((item) => (
            <PlayStoreTextCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}