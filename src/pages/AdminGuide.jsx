import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AppLayout from '@/components/AppLayout';
import GuideForm from '@/components/guides/GuideForm';
import GuideBody from '@/components/guides/GuideBody';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { guidePath, slugify } from '@/lib/guidePaths';

const EMPTY = { language: 'it', title: '', slug: '', seo_title: '', meta_description: '', content: '', faq: [], status: 'draft' };
const STATUS_LABEL = { draft: 'Bozza', published: 'Pubblicata', withdrawn: 'Ritirata' };

export default function AdminGuide() {
  const { toast } = useToast();
  const [guides, setGuides] = useState(null);
  const [current, setCurrent] = useState(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setGuides(await base44.entities.Guide.list('-updated_date', 200));
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (status) => {
    const slug = slugify(current.slug);
    if (!current.title || !slug) {
      toast({ title: 'Titolo e slug sono obbligatori', variant: 'destructive' });
      return;
    }
    const dup = (guides || []).find((g) => g.slug === slug && g.language === current.language && g.id !== current.id);
    if (dup) {
      toast({ title: 'Slug già usato in questa lingua', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const data = { ...current, slug, status: status || current.status || 'draft' };
    if (data.status === 'published' && !data.published_at) data.published_at = new Date().toISOString();
    delete data.id; delete data.created_date; delete data.updated_date; delete data.created_by_id;
    const saved = current.id
      ? await base44.entities.Guide.update(current.id, data)
      : await base44.entities.Guide.create(data);
    setCurrent({ ...data, id: saved.id });
    await load();
    setBusy(false);
    toast({ title: status === 'published' ? 'Guida pubblicata' : status === 'withdrawn' ? 'Guida ritirata' : 'Salvato' });
  };

  const remove = async () => {
    if (!current.id || !window.confirm('Eliminare questa guida?')) return;
    await base44.entities.Guide.delete(current.id);
    setCurrent(null);
    load();
  };

  return (
    <AppLayout>
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="font-heading text-3xl font-semibold mb-4">Guide · Editor</h1>
        {!current && (
          <div className="space-y-3">
            <Button onClick={() => { setCurrent(EMPTY); setPreview(false); }}><Plus className="w-4 h-4" /> Nuova guida</Button>
            {guides === null && <Loader2 className="w-6 h-6 animate-spin" />}
            {(guides || []).map((g) => (
              <button key={g.id} onClick={() => { setCurrent(g); setPreview(false); }} className="w-full text-left rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{g.title}</span>
                  <span className="text-xs rounded-full bg-secondary px-2 py-0.5">{STATUS_LABEL[g.status]} · {g.language.toUpperCase()}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{guidePath(g.language, g.slug)}</div>
              </button>
            ))}
          </div>
        )}
        {current && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrent(null)}><ArrowLeft className="w-4 h-4" /> Elenco</Button>
            <div className="text-sm text-muted-foreground">Stato: {STATUS_LABEL[current.status || 'draft']}</div>
            {preview ? <GuideBody guide={current} jsonLd={false} /> : <GuideForm value={current} onChange={setCurrent} />}
            <div className="flex flex-wrap gap-2 sticky bottom-2 bg-background/90 backdrop-blur p-2 rounded-xl border border-border">
              <Button variant="outline" onClick={() => setPreview(!preview)}>{preview ? 'Modifica' : 'Anteprima'}</Button>
              <Button variant="secondary" disabled={busy} onClick={() => save(current.status === 'published' ? 'published' : 'draft')}>Salva</Button>
              {current.status !== 'published' && <Button disabled={busy} onClick={() => save('published')}>Pubblica</Button>}
              {current.status === 'published' && <Button variant="outline" disabled={busy} onClick={() => save('withdrawn')}>Ritira</Button>}
              {current.id && <Button variant="ghost" onClick={remove}>Elimina</Button>}
              {current.status === 'published' && <Link className="text-sm underline self-center" to={guidePath(current.language, current.slug)}>Apri</Link>}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}