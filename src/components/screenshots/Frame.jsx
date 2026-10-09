import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

// Frame tablet orizzontale 1280×800 (16:10) per gli screenshot Google Play.
// Pannello didascalia a sinistra, schermata a destra. Renderizzato a
// dimensione reale e ridotto solo visivamente: l'export PNG è 1280×800.
const W = 1280;
const H = 800;
const PREVIEW_SCALE = 0.5;

export default function Frame({ caption, index, fileName, children }) {
  const captureRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const downloadPng = async () => {
    if (!captureRef.current || exporting) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(captureRef.current, {
        width: W,
        height: H,
        scale: 1,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = fileName || `ibd-care-tablet-${String(index + 1).padStart(2, '0')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Export frame failed', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <figure className="w-full mx-auto">
      <div
        className="mx-auto overflow-hidden rounded-2xl border border-border shadow-lg"
        style={{ width: W * PREVIEW_SCALE, height: H * PREVIEW_SCALE }}
      >
        <div
          ref={captureRef}
          className="flex origin-top-left bg-background"
          style={{ width: W, height: H, transform: `scale(${PREVIEW_SCALE})` }}
        >
          <figcaption className="w-[380px] shrink-0 bg-primary flex flex-col justify-center px-12">
            <p className="font-heading text-lg font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
              IBD Care · {String(index + 1).padStart(2, '0')}
            </p>
            <p className="mt-4 font-heading text-4xl font-semibold text-primary-foreground leading-tight">
              {caption}
            </p>
          </figcaption>
          <div className="flex-1 bg-muted flex items-center justify-center p-8">
            <div
              className="relative overflow-hidden rounded-[2rem] border border-border bg-background shadow-xl"
              style={{ width: 760, height: 704 }}
            >
              <div className="absolute inset-0 overflow-hidden">{children}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <Button onClick={downloadPng} disabled={exporting} className="rounded-xl h-9 px-4 text-sm">
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          {exporting ? 'Esporto…' : 'Scarica PNG tablet 1280×800'}
        </Button>
      </div>
    </figure>
  );
}