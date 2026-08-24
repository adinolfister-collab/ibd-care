import React, { useState } from 'react';
import { ScanLine, History, BarChart3, CalendarDays } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import MagazineEssay from '@/components/MagazineEssay';
import ExamScanner from '@/components/exams/ExamScanner';
import ExamTimeline from '@/components/exams/ExamTimeline';
import ExamCompare from '@/components/exams/ExamCompare';
import ExamCalendar from '@/components/exams/ExamCalendar';
import { cn } from '@/lib/utils';

export default function Esami() {
  const { t } = useI18n();
  const [tab, setTab] = useState('scan');
  const [signal, setSignal] = useState(0);
  const reload = () => setSignal((n) => n + 1);

  const tabs = [
    { id: 'scan', label: t('exams.tab_scan'), Icon: ScanLine },
    { id: 'timeline', label: t('exams.tab_timeline'), Icon: History },
    { id: 'calendar', label: t('exams.tab_calendar'), Icon: CalendarDays },
    { id: 'compare', label: t('exams.tab_compare'), Icon: BarChart3 },
  ];

  return (
    <AppLayout>
      <PageHeader title={t('exams.title')} subtitle={t('exams.subtitle')} />
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

      {tab === 'scan' && <ExamScanner onSaved={reload} />}
      {tab === 'timeline' && <ExamTimeline reloadKey={signal} />}
      {tab === 'calendar' && <ExamCalendar reloadKey={signal} />}
      {tab === 'compare' && <ExamCompare reloadKey={signal} />}
      </MagazineEssay>
      <EditorialBlock sectionKey="esami_compare" align="left" />
    </AppLayout>
  );
}