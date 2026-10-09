import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

const W = 1280;
const H = 800;
const SCALE = 0.6;

const ROUTES = [
  { path: '/', label: 'Home', slug: 'home' },
  { path: '/symptoms', label: 'Diario sintomi', slug: 'sintomi' },
  { path: '/food', label: 'Alimentazione', slug: 'alimentazione' },
  { path: '/meds', label: 'Terapie', slug: 'terapie' },
  { path: '/trends', label: 'Andamento', slug: 'andamento' },
  { path: '/assistant', label: 'Assistente', slug: 'assistente' },
  { path: '/map', label: 'Mappa centri', slug: 'mappa' },
];

export default function RealScreenshotCapture() {
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const frameRef = useRef(null);
  const route = ROUTES[idx];

  const capture = async () => {
    setBusy(true);
    setError('');
    try {
      const doc = frameRef.current.contentDocument;
      const canvas = await html2canvas(doc.documentElement, {
        width: W,
        height: H,
        windowWidth: W,
        windowHeight: H,
        scale: 1,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `ibd-care-tablet-reale-${route.slug}-${String(idx + 1).padStart(2, '0')}.png`;
      a.click();
    } catch (e) {
      setError('Cattura non riuscita. Attendi il caricamento completo della schermata e riprova.');
    }
    setBusy(false);
  };

  return (
    <section className="mb-10">
      <h2 className="font-heading text-lg font-semibold text-slate-800 dark:text-slate-100">
        Screenshot reali tablet 1280×800
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-3">
        Scegli una schermata dell'app, attendi che sia caricata e scarica il PNG, senza cornici né testi.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        {ROUTES.map((r, i) => (
          <Button
            key={r.path}
            size="sm"
            variant={i === idx ? 'default' : 'outline'}
            onClick={() => setIdx(i)}
            className="rounded-xl"
          >
            {r.label}
          </Button>
        ))}
      </div>
      <div
        className="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700"
        style={{ width: W * SCALE, height: H * SCALE, maxWidth: '100%' }}
      >
        <iframe
          key={route.path}
          ref={frameRef}
          src={route.path}
          title={route.label}
          className="origin-top-left border-0 bg-white"
          style={{ width: W, height: H, transform: `scale(${SCALE})` }}
        />
      </div>
      <Button onClick={capture} disabled={busy} className="mt-3 rounded-xl h-9 px-4 text-sm">
        {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        {busy ? 'Catturo…' : 'Scarica PNG'}
      </Button>
      {error && <p className="text-sm text-rose-700 mt-2">{error}</p>}
    </section>
  );
}