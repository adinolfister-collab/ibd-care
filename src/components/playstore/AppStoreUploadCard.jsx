import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Upload, Download, Trash2, RefreshCw } from 'lucide-react';
import { checkImage } from '@/lib/appStoreSpecs';

const readDims = (url) =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = url;
  });

export default function AppStoreUploadCard({ cat }) {
  const [items, setItems] = useState([]);
  const addRef = useRef(null);
  const replaceRef = useRef(null);
  const replaceId = useRef(null);

  const build = async (file) => {
    const url = URL.createObjectURL(file);
    const { w, h } = await readDims(url);
    return { id: `${file.name}-${Date.now()}-${Math.random()}`, file, url, w, h, ...checkImage(cat, file, w, h) };
  };

  const onAdd = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, cat.max - items.length);
    e.target.value = '';
    const built = await Promise.all(files.map(build));
    setItems((prev) => [...prev, ...built]);
  };

  const onReplace = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const next = await build(file);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== replaceId.current) return it;
        URL.revokeObjectURL(it.url);
        return next;
      })
    );
  };

  const remove = (it) => {
    URL.revokeObjectURL(it.url);
    setItems((prev) => prev.filter((x) => x.id !== it.id));
  };

  const download = (it) => {
    const a = document.createElement('a');
    a.href = it.url;
    a.download = it.file.name;
    a.click();
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-heading text-lg font-semibold text-foreground">{cat.label}</h2>
      <p className="text-sm text-muted-foreground mt-1">{cat.requirement}</p>
      <input ref={addRef} type="file" accept={cat.mimes.join(',')} multiple={cat.max > 1} onChange={onAdd} className="hidden" />
      <input ref={replaceRef} type="file" accept={cat.mimes.join(',')} onChange={onReplace} className="hidden" />
      <Button
        onClick={() => addRef.current?.click()}
        disabled={items.length >= cat.max}
        className="mt-3 rounded-xl h-9 px-4 text-sm"
      >
        <Upload className="w-4 h-4 mr-2" />
        Carica immagini
      </Button>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl border border-border p-3 flex gap-3">
            <img src={it.url} alt={it.file.name} className="w-20 h-28 object-contain rounded-lg bg-muted shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{it.file.name}</p>
              <p className="text-xs text-muted-foreground">Trovato: {it.w}×{it.h} px, {it.file.type || 'tipo sconosciuto'}</p>
              <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${it.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                {it.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {it.ok ? 'Conforme' : !it.mimeOk ? 'Formato non ammesso' : 'Misura non conforme'}
              </p>
              <div className="mt-2 flex gap-1">
                <Button size="icon" variant="outline" title="Scarica" disabled={!it.ok} onClick={() => download(it)}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  title="Sostituisci"
                  onClick={() => {
                    replaceId.current = it.id;
                    replaceRef.current?.click();
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" title="Rimuovi" onClick={() => remove(it)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}