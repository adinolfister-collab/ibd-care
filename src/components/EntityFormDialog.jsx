import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import VoiceButton from '@/components/VoiceButton';
import { cn } from '@/lib/utils';

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring';

export default function EntityFormDialog({ open, onOpenChange, title, submitLabel, fields, initialData, onSubmit }) {
  const [data, setData] = useState(initialData || {});

  useEffect(() => {
    if (open) setData(initialData || {});
  }, [open, initialData]);

  const set = (name, value) => setData((d) => ({ ...d, [name]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto px-1">
          {fields.map((f) => {
            const val = data[f.name] ?? (f.type === 'checkbox' ? false : f.type === 'number' ? '' : '');
            return (
              <div key={f.name}>
                <Label className="text-sm font-medium text-muted-foreground">{f.label}</Label>
                {f.type === 'textarea' && (
                  <div className="mt-1.5 flex items-end gap-2">
                    <Textarea value={val} onChange={(e) => set(f.name, e.target.value)} className={cn(fieldClass, 'flex-1')} rows={3} />
                    <VoiceButton onResult={(txt) => set(f.name, (val ? val + ' ' : '') + txt)} />
                  </div>
                )}
                {f.type === 'select' && (
                  <select value={val} onChange={(e) => set(f.name, e.target.value)} className={fieldClass}>
                    <option value="">—</option>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
                {f.type === 'checkbox' && (
                  <button
                    type="button"
                    onClick={() => set(f.name, !val)}
                    className={cn(
                      'mt-1.5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors',
                      val ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                    )}
                  >
                    <span className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center', val ? 'border-primary-foreground' : 'border-muted-foreground')}>
                      {val && <span className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </span>
                    {val ? 'Sì' : 'No'}
                  </button>
                )}
                {f.type === 'slider' && (
                  <div className="mt-2 flex items-center gap-4">
                    <input
                      type="range"
                      min={f.min ?? 0}
                      max={f.max ?? 10}
                      step={1}
                      value={val === '' ? 0 : val}
                      onChange={(e) => set(f.name, Number(e.target.value))}
                      className="flex-1 accent-primary h-2"
                    />
                    <span className="w-10 text-center text-lg font-semibold text-primary">{val === '' ? 0 : val}</span>
                  </div>
                )}
                {f.type === 'number' && (
                  <Input type="number" value={val} onChange={(e) => set(f.name, e.target.value)} className={fieldClass} />
                )}
                {(f.type === 'text' || f.type === 'date') && (
                  <Input type={f.type} value={val} onChange={(e) => set(f.name, e.target.value)} className={fieldClass} />
                )}
                {f.type === 'file' && (
                  <div className="mt-1.5">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const { file_url } = await base44.integrations.Core.UploadFile({ file });
                          set(f.name, file_url);
                          set(f.name + '_name', file.name);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-accent file:text-accent-foreground file:font-medium"
                    />
                    {val && <p className="text-xs text-primary mt-1.5 truncate">✓ {data[f.name + '_name'] || 'Documento caricato'}</p>}
                  </div>
                )}
              </div>
            );
          })}
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" className="rounded-xl">
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}