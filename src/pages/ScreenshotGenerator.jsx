import React from 'react';
import Frame from '@/components/screenshots/Frame';
import HomeFrame from '@/components/screenshots/HomeFrame';
import SymptomsFrame from '@/components/screenshots/SymptomsFrame';
import FoodFrame from '@/components/screenshots/FoodFrame';
import TrendsFrame from '@/components/screenshots/TrendsFrame';
import MedsFrame from '@/components/screenshots/MedsFrame';
import ReportFrame from '@/components/screenshots/ReportFrame';
import MapFrame from '@/components/screenshots/MapFrame';
import AssistantFrame from '@/components/screenshots/AssistantFrame';
import { CAPTIONS } from '@/lib/screenshotSampleData';

// Pagina nascosta admin: genera i frame 9:16 per gli screenshot del Play Store.
// Nessun AppLayout, nessun tracking, nessuna scrittura su DB. L'admin scorre
// e cattura uno screenshot per ogni frame.
const FRAMES = [
  HomeFrame,
  SymptomsFrame,
  FoodFrame,
  TrendsFrame,
  MedsFrame,
  ReportFrame,
  MapFrame,
  AssistantFrame,
];

export default function ScreenshotGenerator() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <header className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Generatore di screenshot
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Apri questa pagina sul telefono e cattura uno screenshot per ogni frame.
            Le didascalie sono già pronte per la scheda Google Play.
          </p>
        </header>
        <div className="space-y-10">
          {FRAMES.map((FrameContent, i) => (
            <Frame key={i} caption={CAPTIONS[i]} index={i}>
              <FrameContent />
            </Frame>
          ))}
        </div>
      </div>
    </div>
  );
}