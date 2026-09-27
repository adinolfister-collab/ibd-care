import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EmptyState from '@/components/EmptyState';
import MedicationCalendar from '@/components/meds/MedicationCalendar';
import { Button } from '@/components/ui/button';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import ReadonlyBanner from '@/components/ReadonlyBanner';
import PremiumPaywall from '@/components/PremiumPaywall';

export default function MedicationCalendarPage() {
  const { t } = useI18n();
  const { isAuthenticated, authChecked } = useAuth();
  const { guard, showPaywall, setShowPaywall } = useWriteGuard();
  const [meds, setMeds] = useState([]);
  const [doses, setDoses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!isAuthenticated) { setMeds([]); setDoses([]); setLoading(false); return; }
    try {
      const [m, d] = await Promise.all([
        base44.entities.Medication.list('-created_date', 200),
        base44.entities.MedicationDose.list('-created_date', 1000),
      ]);
      setMeds(m);
      setDoses(d);
    } catch {
      setMeds([]); setDoses([]);
    }
    setLoading(false);
  }, [isAuthenticated, authChecked]);

  useEffect(() => { load(); }, [load]);

  const onMark = async (med, day) => {
    if (!guard('dose_write')) return;
    await base44.entities.MedicationDose.create({
      medication_id: med.id,
      medication_name: med.name,
      dose_date: format(day, 'yyyy-MM-dd'),
      status: 'taken',
      scheduled_time: med.times || '',
      taken_at: new Date().toISOString(),
    });
    load();
  };
  const onSkip = async (med, day) => {
    if (!guard('dose_write')) return;
    await base44.entities.MedicationDose.create({
      medication_id: med.id,
      medication_name: med.name,
      dose_date: format(day, 'yyyy-MM-dd'),
      status: 'skipped',
      scheduled_time: med.times || '',
    });
    load();
  };
  const onRemove = async (dose) => {
    if (!guard('dose_write')) return;
    await base44.entities.MedicationDose.delete(dose.id);
    load();
  };

  const hasMeds = meds.filter((m) => m.active).length > 0;

  return (
    <AppLayout>
      <PageHeader
        title={t('meds.cal.title')}
        subtitle={t('meds.cal.subtitle')}
        action={
          <Button variant="outline" onClick={() => window.history.back()} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> {t('common.back')}
          </Button>
        }
      />
      <ReadonlyBanner />
      <PageEditorial pageKey="meds" />
      {loading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : !isAuthenticated ? (
        <EmptyState icon={CalendarDays} title={t('meds.cal.login_required')} description={t('meds.cal.subtitle')} />
      ) : !hasMeds ? (
        <EmptyState icon={CalendarDays} title={t('meds.cal.no_meds')} description={t('meds.cal.no_meds_desc')} />
      ) : (
        <div className="rounded-2xl border border-border bg-background p-3 md:p-5 shadow-sm">
          <MedicationCalendar meds={meds} doses={doses} onMark={onMark} onSkip={onSkip} onRemove={onRemove} />
        </div>
      )}
      <PremiumPaywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </AppLayout>
  );
}