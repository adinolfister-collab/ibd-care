import React, { useRef, useState } from 'react';
import { ScanLine, History, BarChart3, CalendarDays, Upload, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import MagazineEssay from '@/components/MagazineEssay';
import ExamScanner from '@/components/exams/ExamScanner';
import ImportData from '@/components/exams/ImportData';
import ExamTimeline from '@/components/exams/ExamTimeline';
import ExamCompare from '@/components/exams/ExamCompare';
import ExamCalendar from '@/components/exams/ExamCalendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import useRecordScanner from '@/hooks/useRecordScanner';
import { cn } from '@/lib/utils';

export default function Esami() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { scanning, scan } = useRecordScanner();
  const fileRef = useRef(null);
  const [tab, setTab] = useState('scan');
  const [signal, setSignal] = useState(0);
  const [prefill, setPrefill] = useState(null);
  const reload = () => setSignal((n) => n + 1);

  const onScanFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const res = await scan(file);
    if (!res) return;
    if (res.kind === 'medication') {
      toast({ title: 'Terapia salvata', description: res.medication?.name || '' });
      reload();
    } else if (res.kind === 'record') {
      setPrefill(res.record);
      setTab('scan');
    } else if (res.kind === 'duplicate') {
      toast({ title: t('exams.duplicate'), description: t('exams.duplicate_hint'), variant: 'destructive' });
    } else if (res.kind === 'error') {
      toast({ title: t('exams.scan_error'), description: res.error, variant: 'destructive' });
    }
  };

  const tabs = [
    { id: 'scan', label: t('exams.tab_scan'), Icon: ScanLine },
    { id: 'timeline', label: t('exams.tab_timeline'), Icon: History },
    { id: 'calendar', label: t('exams.tab_calendar'), Icon: CalendarDays },
    { id: 'compare', label: t('exams.tab_compare'), Icon: BarChart3 },
    { id: 'import', label: t('exams.tab_import'), Icon: Upload },
  ];

  return (
    <AppLayout>
      <PageHeader
        title={t('exams.title')}
        subtitle={t('exams.subtitle')}
        action={
          <div className="flex gap-2 flex-wrap">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onScanFile} className="hidden" />
            <Button variant="outline" className="rounded-xl" onClick={() => fileRef.current?.click()} disabled={scanning}>
              {scanning ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ScanLine className="w-4 h-4 mr-1.5" />}{t('exams.scan_new_record')}
            </Button>
          </div>
        }
      />
      <PageEditorial pageKey="esami" />
      <MagazineEssay theme="esami" number="01" eyebrow="Esami" title="Scansione e confronto">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              tab === id ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'scan' && <ExamScanner key={prefill ? 'pre' + prefill.record_date : 'scan'} onSaved={() => { setPrefill(null); reload(); }} initialData={prefill} />}
      {tab === 'timeline' && <ExamTimeline reloadKey={signal} />}
      {tab === 'calendar' && <ExamCalendar reloadKey={signal} />}
      {tab === 'compare' && <ExamCompare reloadKey={signal} />}
      {tab === 'import' && <ImportData onSaved={reload} />}
      </MagazineEssay>
      <EditorialBlock sectionKey="esami_compare" align="left" />
    </AppLayout>
  );
}