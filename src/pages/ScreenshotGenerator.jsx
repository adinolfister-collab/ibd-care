import React, { useRef, useState } from 'react';
import Frame from '@/components/screenshots/Frame';
import HomeFrame from '@/components/screenshots/HomeFrame';
import SymptomsFrame from '@/components/screenshots/SymptomsFrame';
import FoodFrame from '@/components/screenshots/FoodFrame';
import TrendsFrame from '@/components/screenshots/TrendsFrame';
import MedsFrame from '@/components/screenshots/MedsFrame';
import ReportFrame from '@/components/screenshots/ReportFrame';
import MapFrame from '@/components/screenshots/MapFrame';
import AssistantFrame from '@/components/screenshots/AssistantFrame';
import RealScreenshotCapture from '@/components/screenshots/RealScreenshotCapture';
import FeatureGraphicFrame from '@/components/screenshots/FeatureGraphicFrame';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Upload } from 'lucide-react';
import { CAPTIONS } from '@/lib/screenshotSampleData';

// Pagina nascosta admin: genera i frame 9:16 per gli screenshot del Play Store
// e un frame 1024×500 (feature graphic) esportabile come PNG.
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

const FRAME_SLUGS = [
  'home',
  'sintomi',
  'diario',
  'trend',
  'terapie',
  'report',
  'mappa',
  'cary',
];

export default function ScreenshotGenerator() {
  const fgRef = useRef(null);
  const logoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportingLogo, setExportingLogo] = useState(false);
  const [logoSrc, setLogoSrc] = useState(null);

  const onPickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoSrc) URL.revokeObjectURL(logoSrc);
    setLogoSrc(URL.createObjectURL(file));
    e.target.value = '';
  };

  const downloadFeatureGraphic = async () => {
    if (!fgRef.current || exporting) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(fgRef.current, {
        width: 1024,
        height: 500,
        scale: 1,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = 'ibd-care-feature-graphic-1024x500.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Export feature graphic failed', e);
    } finally {
      setExporting(false);
    }
  };

  const downloadLogo = async () => {
    if (!logoRef.current || exportingLogo) return;
    setExportingLogo(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(logoRef.current, {
        width: 512,
        height: 512,
        scale: 1,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = 'ibd-care-logo-512x512.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Export logo failed', e);
    } finally {
      setExportingLogo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <header className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Generatore di screenshot
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ogni frame è uno screenshot tablet orizzontale 1280×800 per Google Play: scaricalo con il pulsante sotto.
          </p>
        </header>

        <RealScreenshotCapture />

        {/* Feature graphic 1024×500 esportabile */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold text-slate-800 dark:text-slate-100">
              Feature Graphic 1024×500
            </h2>
            <Button
              onClick={downloadFeatureGraphic}
              disabled={exporting}
              className="rounded-xl h-9 px-4 text-sm"
            >
              {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              {exporting ? 'Esporto…' : 'Scarica PNG'}
            </Button>
          </div>
          <div
            className="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800"
            style={{ height: 300 }}
          >
            <div
              className="origin-top-left"
              style={{ transform: 'scale(0.585)', width: 1024, height: 500 }}
            >
              <FeatureGraphicFrame ref={fgRef} />
            </div>
          </div>
        </section>

        {/* Logo 512×512 esportabile */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold text-slate-800 dark:text-slate-100">
              Logo 512×512
            </h2>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={onPickLogo}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl h-9 px-4 text-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Carica logo
              </Button>
              <Button
                onClick={downloadLogo}
                disabled={exportingLogo || !logoSrc}
                className="rounded-xl h-9 px-4 text-sm"
              >
                {exportingLogo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {exportingLogo ? 'Esporto…' : 'Scarica PNG'}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 p-6" style={{ height: 300 }}>
            <div
              className="origin-top-left overflow-hidden rounded-3xl"
              style={{ transform: 'scale(0.47)', width: 512, height: 512 }}
            >
              <div
                ref={logoRef}
                className="flex items-center justify-center"
                style={{ width: 512, height: 512, background: '#1f4e57' }}
              >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="IBD Care logo"
                    className="object-contain"
                    style={{ width: 420, height: 420 }}
                  />
                ) : (
                  <p className="text-sm text-white/70 text-center px-8">
                    Carica un PNG/JPG del logo dal dispositivo per generare l'icona 512×512.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-10">
          {FRAMES.map((FrameContent, i) => (
            <Frame
              key={i}
              caption={CAPTIONS[i]}
              index={i}
              fileName={`ibd-care-tablet-${FRAME_SLUGS[i]}-${String(i + 1).padStart(2, '0')}.png`}
            >
              <FrameContent />
            </Frame>
          ))}
        </div>
      </div>
    </div>
  );
}