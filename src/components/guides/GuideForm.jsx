import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { guidePath } from '@/lib/guidePaths';

const Field = ({ label, children, hint }) => (
  <label className="block space-y-1">
    <span className="text-sm font-medium">{label}</span>
    {children}
    {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
  </label>
);

export default function GuideForm({ value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  const faq = value.faq || [];
  const setFaq = (i, k, v) => set('faq', faq.map((f, j) => (j === i ? { ...f, [k]: v } : f)));

  return (
    <div className="space-y-4">
      <Field label="Lingua">
        <select
          value={value.language}
          onChange={(e) => set('language', e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="it">Italiano</option>
          <option value="en">English</option>
        </select>
      </Field>
      <Field label="Titolo (H1)"><Input value={value.title || ''} onChange={(e) => set('title', e.target.value)} /></Field>
      <Field label="Slug" hint={`URL pubblico: ${guidePath(value.language, value.slug || '...')}`}>
        <Input value={value.slug || ''} onChange={(e) => set('slug', e.target.value)} />
      </Field>
      <Field label="Slug della traduzione (facoltativo)" hint="Slug della versione nell'altra lingua, per collegare le due guide.">
        <Input value={value.translation_slug || ''} onChange={(e) => set('translation_slug', e.target.value)} />
      </Field>
      <Field label="SEO title" hint={`${(value.seo_title || '').length} caratteri`}>
        <Input value={value.seo_title || ''} onChange={(e) => set('seo_title', e.target.value)} />
      </Field>
      <Field label="Meta description" hint={`${(value.meta_description || '').length} caratteri`}>
        <Textarea rows={3} value={value.meta_description || ''} onChange={(e) => set('meta_description', e.target.value)} />
      </Field>
      <Field label="Contenuto (Markdown: ## titoli, - elenchi, **grassetto**, [link](url))">
        <Textarea rows={18} className="font-mono text-sm" value={value.content || ''} onChange={(e) => set('content', e.target.value)} />
      </Field>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">FAQ</span>
          <Button type="button" size="sm" variant="outline" onClick={() => set('faq', [...faq, { question: '', answer: '' }])}>
            <Plus className="w-4 h-4" /> Aggiungi
          </Button>
        </div>
        {faq.map((f, i) => (
          <div key={i} className="rounded-lg border border-border p-3 space-y-2">
            <Input placeholder="Domanda" value={f.question} onChange={(e) => setFaq(i, 'question', e.target.value)} />
            <Textarea rows={2} placeholder="Risposta" value={f.answer} onChange={(e) => setFaq(i, 'answer', e.target.value)} />
            <Button type="button" size="sm" variant="ghost" onClick={() => set('faq', faq.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4" /> Rimuovi
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}