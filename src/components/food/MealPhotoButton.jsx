import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FoodReviewForm from '@/components/import/FoodReviewForm';

// Scatta o scegli la foto di un piatto: Cary propone gli alimenti, l'utente
// rivede/corregge e conferma prima del salvataggio nel diario.
export default function MealPhotoButton({ onSaved, guard }) {
  const { toast } = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState(null);

  const pick = () => {
    if (guard && !guard('food_write')) return;
    inputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const up = await base44.integrations.Core.UploadPublicFile({ file });
      const res = await base44.functions.invoke('classifyAndExtractImport', { file_url: up.file_url, category_hint: 'piatto' });
      if (res.data?.error) throw new Error(res.data.error);
      setExtracted(res.data.extracted || { meal_type: 'pranzo', items: [] });
    } catch (err) {
      toast({ title: 'Errore', description: String((err && err.message) || err), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const close = () => setExtracted(null);

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <Button onClick={pick} disabled={busy} variant="outline" className="rounded-xl">
        {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Camera className="w-4 h-4 mr-1.5" />}
        {busy ? 'Analisi foto…' : 'Foto del piatto'}
      </Button>
      <Dialog open={!!extracted} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Rivedi il pasto</DialogTitle></DialogHeader>
          {extracted && (
            <FoodReviewForm
              category="piatto"
              extracted={extracted}
              onSaved={() => { close(); toast({ title: 'Pasto aggiunto al diario' }); onSaved && onSaved(); }}
              onCancel={close}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}