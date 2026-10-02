import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Calendar, Download, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import WeeklyReportView from '@/components/reports/WeeklyReportView';
import ShareReportButton from '@/components/reports/ShareReportButton';

export default function WeeklyReport() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('generateWeeklyReport', {});
      setData(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleOpen = async (v) => {
    setOpen(v);
    if (v && !data) await load();
  };

  const exportPdf = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const w = pw - margin * 2;
      const ratio = canvas.height / canvas.width;
      const imgH = w * ratio;
      let heightLeft = imgH;
      let position = margin;
      pdf.addImage(img, 'PNG', margin, position, w, imgH);
      heightLeft -= (ph - margin * 2);
      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgH - heightLeft);
        pdf.addImage(img, 'PNG', margin, position, w, imgH);
        heightLeft -= (ph - margin * 2);
      }
      pdf.save(`IBD-Care-settimanale_${data?.period?.from}_${data?.period?.to}.pdf`);
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  };

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{t('weekly_report.card_title')}</p>
              <p className="text-sm text-muted-foreground">{t('weekly_report.card_desc')}</p>
            </div>
          </div>
          <Button onClick={() => handleOpen(true)} className="rounded-xl shrink-0">
            <Calendar className="w-4 h-4 mr-1.5" /> {t('weekly_report.open')}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('weekly_report.dialog_title')}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : data ? (
            <div ref={reportRef} className="-mx-2">
              <WeeklyReportView data={data} />
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">{t('weekly_report.load_error')}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('weekly_report.close')}</Button>
            <ShareReportButton
              reportType="weekly"
              buildReportData={async () => data}
              variant="outline"
              disabled={!data || loading}
            />
            <Button onClick={exportPdf} disabled={exporting || loading}>
              {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
              {t('weekly_report.export_pdf')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}