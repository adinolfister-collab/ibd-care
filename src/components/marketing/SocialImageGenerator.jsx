import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import PlatformPreview from '@/components/marketing/PlatformPreview';

const FORMATS = [
  { id: 'square', label: 'Quadrato' },
  { id: 'portrait', label: 'Verticale' },
  { id: 'landscape', label: 'Orizzontale' },
];

const PREVIEW_PLATFORMS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
];

export default function SocialImageGenerator({ initialText = '', posts = {} }) {
  const [previewPlatform, setPreviewPlatform] = useState('facebook');
  const [text, setText] = useState(initialText);
  const [format, setFormat] = useState('square');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  const generate = async () => {
    setLoading(true);
    setError('');
    setUrl('');
    try {
      const res = await base44.functions.invoke('generateSocialImage', { text, format });
      if (res.data?.error || !res.data?.url) throw new Error(res.data?.error || 'Generazione non riuscita');
      setUrl(res.data.url);
    } catch (e) {
      setError(e.message || 'Generazione non riuscita');
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    try {
      const blob = await (await fetch(url)).blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'post-social.png';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, '_blank', 'noopener');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-terracotta" /> Generatore immagini
          </h2>
          <div>
            <Label htmlFor="img-text">Testo del post</Label>
            <Textarea
              id="img-text"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Incolla o scrivi il testo del post. Si compila da solo dopo «Genera post»."
              className="mt-1"
            />
          </div>
          <div>
            <Label>Formato</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm border transition-colors',
                    format === f.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={generate} disabled={loading || !text.trim()} className="w-full rounded-xl" size="lg">
            {loading ? (
              <><span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> Creazione immagine…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Genera immagine</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="font-heading text-lg font-semibold flex items-center gap-2 mb-4">
            <ImageIcon className="w-4 h-4 text-terracotta" /> Anteprima
          </h2>
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 mb-3 text-sm flex items-center justify-between gap-2">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
                <RefreshCw className="w-3.5 h-3.5" /> Riprova
              </Button>
            </div>
          )}
          {loading ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-16 text-center">
              <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-terracotta rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Creazione immagine…</p>
            </div>
          ) : url ? (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
                <Image src={url} alt="Immagine generata" fittingType="fit" className="w-full" />
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Anteprima del post prima di condividere</p>
                <div className="flex gap-1.5 mb-3 overflow-x-auto">
                  {PREVIEW_PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPreviewPlatform(p.id)}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm border whitespace-nowrap transition-colors',
                        previewPlatform === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:bg-accent'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <PlatformPreview
                  platform={previewPlatform}
                  post={posts[previewPlatform] || { text }}
                  imageUrl={url}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={download} className="bg-terracotta text-terracotta-foreground hover:bg-terracotta/90">
                  <Download className="w-4 h-4" /> Scarica immagine
                </Button>
                <Button variant="outline" onClick={generate}>
                  <RefreshCw className="w-4 h-4" /> Rigenera
                </Button>
              </div>
            </div>
          ) : (
            !error && (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">L'immagine generata apparirà qui.</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}