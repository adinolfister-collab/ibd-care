import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { exportDoctorSummaryPdf } from '@/lib/doctorSummaryPdf';

// Bottone "Scarica riepilogo per il medico": carica sintomi + farmaci e genera
// un PDF doctor-friendly con andamento e terapie correnti.
export default function DoctorSummaryExport({ range = 28, note = '' }) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const [symptoms, meds] = await Promise.all([
        base44.entities.SymptomEntry.list('-entry_date', 500),
        base44.entities.Medication.list('-created_date', 500),
      ]);
      if (!symptoms.length && !meds.length) {
        toast({ title: t('doctor_pdf.empty_title'), description: t('doctor_pdf.empty_desc'), variant: 'destructive' });
        return;
      }
      exportDoctorSummaryPdf({ symptoms, meds, range, t, lang, note });
      toast({ title: t('doctor_pdf.done_title'), description: t('doctor_pdf.done_desc') });
    } catch (e) {
      toast({ title: t('doctor_pdf.error_title'), description: e?.message || t('doctor_pdf.error_desc'), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={handle} disabled={busy} variant="outline" className="rounded-xl">
      {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
      {busy ? t('common.loading') : t('doctor_pdf.button')}
    </Button>
  );
}