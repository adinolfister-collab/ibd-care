import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { Button } from '@/components/ui/button';
import PremiumPaywall from '@/components/PremiumPaywall';
import { exportClinicalReportPdf } from '@/lib/clinicalReportPdf';
import { useToast } from '@/components/ui/use-toast';

// Bottone di export del Riepilogo Clinico PDF (gated Premium). Carica anche
// ActivityEntry e WeightEntry per includere la sezione "Bilancio calorico
// e peso" nel report gastroenterologico.
export default function ClinicalReportButton({ indices, symptoms, foods, user, disabled }) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { requirePremium, showPaywall, setShowPaywall } = usePremiumGate();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!requirePremium('clinical_pdf')) return;
    if (!indices.length && !symptoms.length) {
      toast({ title: t('clinical_pdf.empty_title'), description: t('clinical_pdf.empty_desc'), variant: 'destructive' });
      return;
    }
    setExporting(true);
    try {
      let activities = [];
      let weights = [];
      if (isAuthenticated) {
        const [a, w] = await Promise.all([
          base44.entities.ActivityEntry.list('-entry_date', 1000),
          base44.entities.WeightEntry.list('-entry_date', 1000),
        ]);
        activities = a;
        weights = w;
      }
      exportClinicalReportPdf({ indices, symptoms, foods, activities, weights, user, t, lang });
      toast({ title: t('clinical_pdf.done_title'), description: t('clinical_pdf.done_desc') });
    } catch {
      toast({ title: t('clinical_pdf.error_title'), description: t('clinical_pdf.error_desc'), variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button onClick={handleExport} disabled={exporting || disabled} variant="outline" className="rounded-xl">
        {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileDown className="w-4 h-4 mr-1.5" />}
        {t('clinical.report_btn')}
      </Button>
      <PremiumPaywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
}