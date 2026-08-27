import React, { useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ExamScanner from '@/components/exams/ExamScanner';
import ExamTimeline from '@/components/exams/ExamTimeline';
import ExamCompare from '@/components/exams/ExamCompare';
import ExamCalendar from '@/components/exams/ExamCalendar';
import ImportData from '@/components/exams/ImportData';
import { useToast } from '@/components/ui/use-toast';

export default function Esami() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tab, setTab] = useState('scan');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = useCallback(() => {
    toast({ title: t('exams.save'), description: '' });
    setRefreshKey((k) => k + 1);
  }, [toast, t]);

  return (
    <AppLayout>
      <PageHeader title={t('exams.title')} subtitle={t('exams.subtitle')} />
      <PageEditorial pageKey="esami" />

      <Tabs value={tab} onValueChange={setTab} className="mt-2">
        <TabsList className="flex flex-wrap h-auto p-1 bg-accent rounded-xl gap-1">
          <TabsTrigger value="scan" className="rounded-lg data-[state=active]:bg-background">{t('exams.tab_scan')}</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg data-[state=active]:bg-background">{t('exams.tab_timeline')}</TabsTrigger>
          <TabsTrigger value="compare" className="rounded-lg data-[state=active]:bg-background">{t('exams.tab_compare')}</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-background">{t('exams.tab_calendar')}</TabsTrigger>
          <TabsTrigger value="import" className="rounded-lg data-[state=active]:bg-background">{t('exams.tab_import')}</TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="mt-4">
          <ExamScanner onSaved={handleSaved} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-4">
          <ExamTimeline key={'tl-' + refreshKey} />
        </TabsContent>
        <TabsContent value="compare" className="mt-4">
          <ExamCompare key={'cmp-' + refreshKey} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <ExamCalendar key={'cal-' + refreshKey} />
        </TabsContent>
        <TabsContent value="import" className="mt-4">
          <ImportData onSaved={handleSaved} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}