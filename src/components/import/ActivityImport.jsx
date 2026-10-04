import React, { useState } from 'react';
import { ScanLine, FileUp, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ActivityReviewForm from './ActivityReviewForm';

// Import attivita' da fonti esterne per chi non usa Google Fit.
// Due percorsi:
//  - Screenshot di un'app salute (Samsung Health, Apple Health, Google Fit):
//    upload pubblico -> classifyAndExtractImport -> Cary legge la schermata
//    -> form di revisione con i valori estratti.
//  - CSV export multi-giorno: upload privato -> importActivityCsv -> parse
//    server-side -> form di revisione con tutte le righe.
// Nessun record viene salvato senza conferma esplicita dell'utente.
export default function ActivityImport({ defaultDate, onSaved }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState(null); // null = nessuna estrazione in corso
  const [kind, setKind] = useState(null); // 'screenshot' | 'csv'

  const handleScreenshot = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setRows(null);
    try {
      const up = await base44.integrations.Core.UploadPublicFile({ file });
      const res = await base44.functions.invoke('classifyAndExtractImport', { file_url: up.file_url });
      const cat = res.data && res.data.category;
      if (cat !== 'attivita') {
        toast({
          title: t('common.error'),
          description: t('import.activity_wrong_type'),
          variant: 'destructive'
        });
        return;
      }
      setKind('screenshot');
      setRows([res.data.extracted]);
    } catch (err) {
      toast({ title: t('common.error'), description: String(err && err.message || err), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleCsv = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setRows(null);
    try {
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      const res = await base44.functions.invoke('importActivityCsv', { file_uri: up.file_uri });
      setKind('csv');
      setRows(res.data.rows);
    } catch (err) {
      const msg = err && err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : String(err && err.message || err);
      toast({ title: t('common.error'), description: msg, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const close = () => { setRows(null); setKind(null); };

  const handleSaved = () => {
    close();
    toast({ title: t('import.activity_saved') });
    onSaved && onSaved();
  };

  return (
    <div className="space-y-3">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('import.activity_import_title')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium text-primary cursor-pointer hover:bg-accent transition-colors min-h-[44px]">
              <ScanLine className="w-4 h-4" />
              <span>{t('import.scan_screenshot')}</span>
              <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
            </label>
            <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-medium text-primary cursor-pointer hover:bg-accent transition-colors min-h-[44px]">
              <FileUp className="w-4 h-4" />
              <span>{t('import.import_csv')}</span>
              <input type="file" accept=".csv,text/csv" onChange={handleCsv} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{t('import.activity_hint')}</p>
        </CardContent>
      </Card>

      {busy && (
        <Card className="border-0 shadow-sm"><CardContent className="p-5 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm">{t('import.extracting')}</span>
        </CardContent></Card>
      )}

      {rows && !busy && (
        <ActivityReviewForm
          rows={rows}
          kind={kind}
          defaultDate={defaultDate}
          onSaved={handleSaved}
          onCancel={close}
        />
      )}
    </div>
  );
}