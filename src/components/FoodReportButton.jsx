import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { exportFoodReportPdf } from '@/lib/foodReportPdf';
import PremiumPaywall from '@/components/PremiumPaywall';

// Pulsante "Prepara l'appuntamento col gastro": genera un PDF delle ultime
// 2 settimane alimentari. Gated Premium (usePremiumGate).
export default function FoodReportButton({ foods }) {
  const { t } = useI18n();
  const { isSubscribed, requirePremium, showPaywall, setShowPaywall } = usePremiumGate();
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (!requirePremium()) return;
    setBusy(true);
    try {
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 13);
      const startKey = start.toISOString().slice(0, 10);
      const recent = (foods || [])
        .filter((f) => (f.entry_date || '') >= startKey)
        .sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''));
      exportFoodReportPdf(recent);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button onClick={handle} disabled={busy} variant="outline" className="rounded-xl">
        {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileDown className="w-4 h-4 mr-1.5" />}
        {t('food.report_btn')}
      </Button>
      <PremiumPaywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </>
  );
}