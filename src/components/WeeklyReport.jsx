import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Calendar, Download, Loader2, TrendingUp, Utensils, AlertTriangle, Droplet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { localeForLang } from '@/lib/enumLabels';

const PRIMARY = '#0d9488';
const FATIGUE = '#f59e0b';
const BOWEL = '#0ea5e9';

export default function WeeklyReport() {
  const { t, lang } = useI18n();
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

  const fmtDay = (ds) => {
    const d = new Date(ds + 'T00:00:00');
    return d.toLocaleDateString(localeForLang(lang), { day: '2-digit', month: '2-digit' });
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

  const chartData = data ? data.days.map((d) => ({
    day: fmtDay(d.date),
    dolore: d.avg_pain !== null ? Number(d.avg_pain.toFixed(1)) : null,
    stanchezza: d.avg_fatigue !== null ? Number(d.avg_fatigue.toFixed(1)) : null,
    scariche: d.bowel_movements
  })) : [];

  const statCards = data ? [
    { label: t('weekly_report.avg_pain'), value: `${data.stats.week_avg_pain}/10`, icon: TrendingUp, color: PRIMARY },
    { label: t('weekly_report.avg_fatigue'), value: `${data.stats.week_avg_fatigue}/10`, icon: Loader2, color: FATIGUE },
    { label: t('weekly_report.total_bowel'), value: data.stats.total_bowel, icon: Droplet, color: BOWEL },
    { label: t('weekly_report.blood_days'), value: data.stats.blood_days, icon: AlertTriangle, color: '#ef4444' },
    { label: t('weekly_report.total_meals'), value: data.stats.total_meals, icon: Utensils, color: '#22c55e' },
    { label: t('weekly_report.reaction_meals'), value: data.stats.reaction_meals, icon: AlertTriangle, color: '#f97316' }
  ] : [];

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
            <div ref={reportRef} className="bg-white text-slate-800 p-4 -mx-2 rounded-lg space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <p className="text-xl font-bold">{t('weekly_report.header')}</p>
                  <p className="text-sm text-slate-500">{t('weekly_report.period')} {data.period.from} — {data.period.to}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: PRIMARY }}>
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {statCards.map((s) => (
                  <div key={s.label} className="rounded-xl border border-slate-200 p-3">
                    <s.icon className="w-4 h-4 mb-1" style={{ color: s.color }} />
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold mb-2">{t('weekly_report.trend_title')}</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="dolore" name={t('weekly_report.avg_pain')} stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="stanchezza" name={t('weekly_report.avg_fatigue')} stroke={FATIGUE} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold mb-2">{t('weekly_report.bowel_title')}</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip />
                    <Bar dataKey="scariche" name={t('weekly_report.total_bowel')} fill={BOWEL} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> {t('weekly_report.suspicious_title')}</p>
                {data.suspicious_foods.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('weekly_report.no_correlation')}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.suspicious_foods.map((f) => (
                      <span key={f.name} className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: '#fef3c7', color: '#92400e' }}>
                        {f.name} · {f.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 border-t border-slate-200 pt-2">{t('weekly_report.footer')}</p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">{t('weekly_report.load_error')}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('weekly_report.close')}</Button>
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