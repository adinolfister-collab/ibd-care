import React, { useState } from 'react';
import { Share2, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n';
import { SITE_BASE } from '@/lib/seo';

// Reusable "Share Report" button. Calls createShareableReport with the
// payload returned by `buildReportData` (async), then copies the public
// /report/:shareId link to the clipboard and shows a toast.
export default function ShareReportButton({ reportType, buildReportData, ...props }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const reportData = await buildReportData();
      const res = await base44.functions.invoke('createShareableReport', {
        report_type: reportType,
        report_data: reportData,
      });
      const shareId = res.data?.shareId;
      if (!shareId) throw new Error('no share id');
      const url = `${SITE_BASE}/report/${shareId}`;
      try { await navigator.clipboard.writeText(url); } catch (e) { /* clipboard may be blocked */ }
      setDone(true);
      toast({
        title: t('report.share_toast_title') || 'Link copied',
        description: t('report.share_toast_desc') || 'Share this link with your doctor or loved ones. It expires in 30 days.',
      });
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      toast({ title: t('report.share_error') || 'Unable to create share link', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={share} disabled={busy} {...props}>
      {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : done ? <Check className="w-4 h-4 mr-1.5" /> : <Share2 className="w-4 h-4 mr-1.5" />}
      {t('report.share_btn') || 'Share Report'}
    </Button>
  );
}