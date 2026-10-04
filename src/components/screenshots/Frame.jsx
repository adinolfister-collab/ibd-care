import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

// Contenitore frame 9:16 per il generatore di screenshot. Mostra la schermata
// a tutta altezza con una didascalia italiana sovrapposta in alto
// (sfondo primary semitrasparente, font-heading). Lo sfondo neutro tra un
// frame e l'altro è gestito dalla pagina. Include un pulsante per esportare
// il frame come singolo PNG a dimensione reale via html2canvas.
export default function Frame({ caption, index, fileName, children, className = '' }) {
  const captureRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const downloadPng = async () => {
    if (!captureRef.current || exporting) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const node = captureRef.current;
      const rect = node.getBoundingClientRect();
      const scale = Math.max(1, Math.round(1080 / rect.width));
      const canvas = await html2canvas(node, {
        scale,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = fileName || `ibd-care-screenshot-${String(index + 1).padStart(2, '0')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Export frame failed', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <figure className="relative w-full max-w-[420px] mx-auto">
      <div
        ref={captureRef}
        className={cn(
          'relative w-full overflow-hidden rounded-[2rem] border border-border bg-background shadow-lg',
          className
        )}
        style={{ aspectRatio: '9 / 16' }}
      >
        {/* Didascalia sovrapposta in alto */}
        <figcaption className="absolute top-0 inset-x-0 z-20 px-4 py-3 bg-primary/85 backdrop-blur-sm">
          <p className="text-[0.6rem] font-heading font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
            IBD Care · {String(index + 1).padStart(2, '0')}
          </p>
          <p className="mt-0.5 font-heading text-base font-semibold text-primary-foreground leading-tight">
            {caption}
          </p>
        </figcaption>
        {/* Contenuto schermata, scrollabile/ritagliato */}
        <div className="absolute inset-0 pt-16 overflow-hidden">
          {children}
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <Button
          onClick={downloadPng}
          disabled={exporting}
          className="rounded-xl h-9 px-4 text-sm"
        >
          {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          {exporting ? 'Esporto…' : 'Scarica PNG'}
        </Button>
      </div>
    </figure>
  );
}