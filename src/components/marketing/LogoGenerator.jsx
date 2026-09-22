import React, { useState } from 'react';
import { Sparkles, Download, ImageIcon, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// 4 angolazioni fotografiche: il backend combina la descrizione (soggetto)
// con uno stile fotorealistico editoriale. Nessuna illustrazione/disegno.
const VARIATIONS = [
  'Macro close-up shot, shallow depth of field, soft natural window light, intimate and calm.',
  'Soft-focus environmental photograph, gentle bokeh, muted earthy tones, editorial magazine feel.',
  'Overhead flat-lay composition, diffused daylight, balanced negative space, refined and clean.',
  'Environmental lifestyle photograph, natural ambient light, organic textures, warm and human.',
];

export default function LogoGenerator() {
  const { toast } = useToast();
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');

  const canGenerate = description.trim().length > 0 && !loading;

  const generate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    // Svuoto per mostrare subito gli skeleton
    setLogos(VARIATIONS.map((v, i) => ({ id: i, url: null, prompt: v })));
    try {
      const res = await base44.functions.invoke('generateLogoVariants', {
        description: description.trim(),
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
            disabled={!canGenerate}
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

        <div className="mb-4">
          <Label htmlFor="logo-desc" className="text-sm font-medium mb-1.5 block">
            Descrizione / soggetto del logo
          </Label>
          <Input
            id="logo-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Es. sezione news, about, home, diario sintomi…"
            className="rounded-xl"
            maxLength={300}
          />
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