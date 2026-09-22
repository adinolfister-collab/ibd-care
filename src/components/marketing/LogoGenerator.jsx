import React, { useState } from 'react';
import { Sparkles, Download, ImageIcon, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Genera un batch di 4 varianti di logo a simbolo medico astratto
// (palette teal + terracotta) e permette il download JPG di ciascuna.
const PROMPT_BASE =
  'Minimal abstract medical logo for a gut health (IBD: Crohn and Colitis) care app. ' +
  'Soft, calming, organic abstract symbol evoking an intestine wave, gentle flowing lines, ' +
  'rounded forms, clean and modern. Palette: deep teal #2c5f5d and warm terracotta #c97b5a ' +
  'on a clean off-white background. No text, no letters, no words. Centered, balanced, ' +
  'high-end editorial feel, photographic, crisp, premium app identity. Square composition.';

const VARIATIONS = [
  'Single flowing line forming a soft spiral/intestine motif, centered, lots of breathing space.',
  'Two interwoven organic ribbons forming a calm protective shape, symmetrical and elegant.',
  'Abstract concentric soft waves radiating from center, suggesting care and balance, minimalist.',
  'Negative-space leaf-and-gut hybrid glyph, rounded, warm and human, refined and distinctive.',
];

export default function LogoGenerator() {
  const { toast } = useToast();
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    // Svuoto per mostrare subito gli skeleton
    setLogos(VARIATIONS.map((v, i) => ({ id: i, url: null, prompt: v })));
    try {
      const res = await base44.functions.invoke('generateLogoVariants', {
        promptBase: PROMPT_BASE,
        variations: VARIATIONS,
      });
      const results = res.data?.logos || [];
      setLogos((prev) =>
        prev.map((item, i) => ({
          ...item,
          url: results[i]?.url || null,
          error: results[i]?.error || null,
        }))
      );
      const ok = results.filter((r) => r?.url).length;
      if (ok === 0) {
        toast({ title: 'Generazione fallita', variant: 'destructive' });
      } else if (ok < VARIATIONS.length) {
        toast({ title: `${ok} su ${VARIATIONS.length} loghi generati` });
      } else {
        toast({ title: 'Varianti pronte' });
      }
    } catch (e) {
      toast({ title: 'Errore generazione', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const download = async (url, index) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `ibd-care-logo-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      // Fallback: apertura diretta
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="mt-1.5 h-8 w-1.5 rounded-full bg-terracotta shrink-0" />
          <div className="flex-1">
            <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-terracotta" /> Generatore Logo
            </h2>
            <p className="text-sm text-muted-foreground">
              Genera varianti di logo a simbolo medico astratto (teal + terracotta) e scarica la più adatta come JPG.
            </p>
          </div>
          <Button
            onClick={generate}
            disabled={loading}
            className="shrink-0 rounded-xl"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> Generazione…</>
            ) : logos.length > 0 ? (
              <><RefreshCw className="w-4 h-4" /> Genera altre varianti</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Genera varianti</>
            )}
          </Button>
        </div>

        {logos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Premi «Genera varianti» per creare 4 loghi a simbolo medico astratto da confrontare e scaricare.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {logos.map((logo, i) => (
              <div
                key={logo.id}
                className={cn(
                  'rounded-xl overflow-hidden border border-border bg-muted/30 flex flex-col',
                  i === 1 && 'lg:col-span-1'
                )}
              >
                <div className="aspect-square w-full bg-muted/40 flex items-center justify-center">
                  {loading && !logo.url ? (
                    <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-terracotta rounded-full animate-spin" />
                  ) : logo.url ? (
                    <Image
                      src={logo.url}
                      alt={`Logo variante ${i + 1}`}
                      fittingType="fill"
                      className="w-full h-full block"
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground px-3 text-center">Generazione non riuscita</div>
                  )}
                </div>
                <div className="p-2 border-t border-border bg-card">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg"
                    disabled={!logo.url}
                    onClick={() => download(logo.url, i)}
                  >
                    <Download className="w-4 h-4" /> Variante {i + 1}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}