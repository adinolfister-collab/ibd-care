import React, { useState, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useRegisterGate } from '@/hooks/useRegisterGate';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ExamScanner from '@/components/exams/ExamScanner';
import SmartScanner from '@/components/import/SmartScanner';
import ExamTimeline from '@/components/exams/ExamTimeline';
import ExamCompare from '@/components/exams/ExamCompare';
import ExamCalendar from '@/components/exams/ExamCalendar';
import ImportData from '@/components/exams/ImportData';
import PremiumLockedCard from '@/components/PremiumLockedCard';
import GuestSignupCard from '@/components/GuestSignupCard';
import DemoBanner from '@/components/DemoBanner';
import PremiumPaywall from '@/components/PremiumPaywall';
import { usePremiumGate } from '@/hooks/usePremiumGate';
import { trackTrialFeature } from '@/lib/trialTracking';
import { useToast } from '@/components/ui/use-toast';

export default function Esami() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const gate = useRegisterGate();
  const { isSubscribed, isGuest, showPaywall, setShowPaywall } = usePremiumGate();
  const [tab, setTab] = useState('scan');
  const [refreshKey, setRefreshKey] = useState(0);

  // Scanner AI and import are Premium services: guests must log in first,
  // authenticated free users see the subscription paywall.
  const openPaywall = () => {
    if (!gate()) return;
    setShowPaywall(true);
  };

  const handleSaved = useCallback(() => {
    toast({ title: t('exams.save'), description: '' });
    setRefreshKey((k) => k + 1);
  }, [toast, t]);

  return (
    <AppLayout>
      <PageHeader title={t('exams.title')} subtitle={t('exams.subtitle')} />
      <PageEditorial pageKey="esami" />
      {!isAuthenticated && <DemoBanner onReset={() => setRefreshKey((k) => k + 1)} />}

      <Tabs value={tab} onValueChange={setTab} className="mt-2">
        <TabsList className="flex flex-wrap h-auto p-1 bg-accent rounded-xl gap-1">
          <TabsTrigger value="smart" className="rounded-lg data-[state=active]:bg-background">{t('import.smart_title')}</TabsTrigger>
          <TabsTrigger value="scan" className="rounded-lg data-[state=active]:bg-background">{t('exams.tab_scan')}</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-lg data-[state=active]:bg-background">{t('exams.tab_timeline')}</TabsTrigger>
          <TabsTrigger value="compare" className="rounded-lg data-[state=active]:bg-background">{t('exams.tab_compare')}</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-background">{t('exams.tab_calendar')}</TabsTrigger>
          <TabsTrigger value="import" className="rounded-lg data-[state=active]:bg-background">{t('exams.tab_import')}</TabsTrigger>
        </TabsList>

        <TabsContent value="smart" className="mt-4">
          {isSubscribed ? (
            <SmartScanner onSaved={handleSaved} />
          ) : isGuest ? (
            <GuestSignupCard feature="exam_scan" />
          ) : (
            <PremiumLockedCard onUnlock={() => { trackTrialFeature('exam_scan', 'blocked'); openPaywall(); }} />
          )}
        </TabsContent>
        <TabsContent value="scan" className="mt-4">
          {isSubscribed ? (
            <ExamScanner onSaved={handleSaved} />
          ) : isGuest ? (
            <GuestSignupCard feature="exam_scan" />
          ) : (
            <PremiumLockedCard onUnlock={() => { trackTrialFeature('exam_scan', 'blocked'); openPaywall(); }} />
          )}
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
          {isSubscribed ? (
            <ImportData onSaved={handleSaved} />
          ) : isGuest ? (
            <GuestSignupCard feature="exam_import" />
          ) : (
            <PremiumLockedCard onUnlock={() => { trackTrialFeature('exam_import', 'blocked'); openPaywall(); }} />
          )}
        </TabsContent>
      </Tabs>

      <PremiumPaywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </AppLayout>
  );
}