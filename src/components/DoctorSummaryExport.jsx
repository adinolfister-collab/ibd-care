import React from 'react';
import { FileDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { exportDoctorSummaryPdf } from '@/lib/doctorSummaryPdf';
import PremiumExportButton from '@/components/PremiumExportButton';

// "Scarica riepilogo per il medico": riservato a Premium.
// PremiumExportButton gestisce il gate (ospite → /login, free → /abbonamento
// con trackPremiumAttempt, abbonato → export). Qui solo la logica di generazione.
export default function DoctorSummaryExport({ range = 28, note = '' }) {
  const { t, lang } = useI18n();
  const { toast } = useToast();

  const handle = async () => {
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
    }
  };

  return (
    <PremiumExportButton
      onExport={handle}
      label={t('doctor_pdf.button')}
      lockedLabel={t('doctor_pdf.locked')}
      feature="doctor_pdf"
      icon={FileDown}
    />
  );
}