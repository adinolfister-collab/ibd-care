import React, { useState } from 'react';
import { ScanLine, Loader2, X, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import MedicalReviewForm from './MedicalReviewForm';
import ActivityReviewForm from './ActivityReviewForm';
import FoodReviewForm from './FoodReviewForm';

// Scanner smart unificato: l'utente carica un documento o un'immagine,
// Cary classifica (referto medico / attivita' / etichetta / piatto) ed estrae
// i dati, che vengono presentati in un form di revisione specifico per la
// categoria. Nessun record viene salvato senza conferma.
export default function SmartScanner({ onSaved }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { category, extracted, duplicate, fileUrl }
  const [fileName, setFileName] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setResult(null);
    setFileName(file.name);
    try {
      const up = await base44.integrations.Core.UploadPublicFile({ file });
      const res = await base44.functions.invoke('classifyAndExtractImport', { file_url: up.file_url });
      setResult({ ...res.data, fileUrl: up.file_url });
    } catch (err) {
      toast({ title: t('common.error'), description: String(err && err.message || err), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setResult(null); setFileName(null); };

  const handleSaved = (msg) => {
    reset();
    toast({ title: msg || t('import.saved') });
    onSaved && onSaved();
  };

  const categoryLabel = result && {
    referto_medico: t('import.cat_referto'),
    attivita: t('import.cat_attivita'),
    etichetta: t('import.cat_etichetta'),
    piatto: t('import.cat_piatto'),
  }[result.category];

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">{t('import.smart_title')}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('import.smart_desc')}</p>
          <div className="rounded-xl border-2 border-dashed border-input bg-background px-4 py-6 text-center transition-colors hover:border-primary/50">
            <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" id="smart-scan-file" />
            <label htmlFor="smart-scan-file" className="inline-flex items-center gap-2 cursor-pointer text-primary font-medium">
              <ScanLine className="w-5 h-5" /> {t('import.smart_pick')}
            </label>
            {fileName && <p className="text-xs text-muted-foreground mt-2 truncate">{fileName}</p>}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('import.scan_privacy')}</p>
        </CardContent>
      </Card>

      {busy && (
        <Card className="border-0 shadow-sm"><CardContent className="p-6 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm">{t('import.classifying')}</span>
        </CardContent></Card>
      )}

      {result && !busy && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-accent/60 px-3 py-2">
            <p className="text-xs font-medium text-accent-foreground">{t('import.detected')}: <span className="font-semibold">{categoryLabel}</span></p>
            <button onClick={reset} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground" aria-label={t('common.cancel')}><X className="w-4 h-4" /></button>
          </div>

          {result.category === 'referto_medico' && (
            <MedicalReviewForm
              extracted={result.extracted}
              duplicate={result.duplicate}
              fileUrl={result.fileUrl}
              onSaved={handleSaved}
              onCancel={reset}
            />
          )}
          {result.category === 'attivita' && (
            <ActivityReviewForm
              rows={[result.extracted]}
              kind="screenshot"
              onSaved={() => handleSaved(t('import.activity_saved'))}
              onCancel={reset}
            />
          )}
          {(result.category === 'etichetta' || result.category === 'piatto') && (
            <FoodReviewForm
              category={result.category}
              extracted={result.extracted}
              onSaved={handleSaved}
              onCancel={reset}
            />
          )}
        </div>
      )}
    </div>
  );
}