import React, { useEffect, useState } from 'react';
import { Stethoscope, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import MagazineEssay from '@/components/MagazineEssay';
import EditorialBlock from '@/components/EditorialBlock';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import HBIForm from '@/components/clinical/HBIForm';
import PartialMayoForm from '@/components/clinical/PartialMayoForm';
import ClinicalIndexHistory from '@/components/clinical/ClinicalIndexHistory';
import ClinicalReportButton from '@/components/clinical/ClinicalReportButton';
import { calcHBI, calcPartialMayo, severityLabelKey } from '@/lib/clinicalIndices';
import { useToast } from '@/components/ui/use-toast';
import { useWriteGuard } from '@/hooks/useWriteGuard';
import PremiumPaywall from '@/components/PremiumPaywall';
import RegisterNudge from '@/components/RegisterNudge';
import EmptyState from '@/components/EmptyState';

// Nuova sezione clinica "Prepara la tua Visita": calcolo standardizzato degli
// indici HBI (Crohn) e Partial Mayo (Colite Ulcerosa), storico consultabile e
// export PDF gastroenterologo-friendly (Premium). Il calcolo e lo storico sono
// gratuiti per tutti gli utenti registrati; l'export PDF e' gated Premium.
export default function PreparaVisita() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { guard, showPaywall, setShowPaywall, showNudge, setShowNudge, isDemo } = useWriteGuard();
  const [disease, setDisease] = useState('hbi');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await base44.entities.ClinicalIndexEntry.list('-entry_date', 500);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [isAuthenticated]);

  const handleSave = async (payload) => {
    if (!guard('clinical_index_write')) return;
    if (isDemo) return; // demo: punteggio visibile live, storico richiede registrazione
    setSaving(true);
    try {
      const calc = payload.index_type === 'hbi'
        ? calcHBI(payload.answers, payload.complications)
        : calcPartialMayo(payload.answers);
      const entry = await base44.entities.ClinicalIndexEntry.create({
        index_type: payload.index_type,
        score: calc.score,
        severity_label: calc.severity,
        entry_date: new Date().toISOString().slice(0, 10),
        answers: payload.answers,
        complications: payload.complications || [],
      });
      setItems((prev) => [entry, ...prev]);
      toast({ title: t('clinical.saved_title'), description: `${t('clinical.score')}: ${calc.score} · ${t(severityLabelKey(calc.severity))}` });
    } catch {
      toast({ title: t('common.error'), description: t('common.error_save'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.ClinicalIndexEntry.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast({ title: t('common.error'), description: t('common.error_save'), variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title={t('clinical.title')}
        subtitle={t('clinical.subtitle')}
        action={
          <ClinicalReportButton indices={items} symptoms={[]} foods={[]} user={user} disabled={items.length === 0} />
        }
      />
      <PageEditorial pageKey="visita" />
      <MagazineEssay theme="clinica" number="01" eyebrow={t('clinical.magazine_eyebrow')} title={t('clinical.magazine_title')}>
        {!isAuthenticated && (
          <div className="mb-5 rounded-2xl border border-terracotta/30 bg-terracotta/5 p-4">
            <p className="text-sm text-accent-foreground">{t('clinical.guest_notice')}</p>
          </div>
        )}

        <Tabs value={disease} onValueChange={setDisease} className="mb-5">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="hbi">{t('clinical.hbi_name')}</TabsTrigger>
            <TabsTrigger value="partial_mayo">{t('clinical.mayo_name')}</TabsTrigger>
          </TabsList>
          <TabsContent value="hbi" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-4">{t('clinical.hbi_desc')}</p>
                <HBIForm onSave={handleSave} saving={saving} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="partial_mayo" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground mb-4">{t('clinical.mayo_desc')}</p>
                <PartialMayoForm onSave={handleSave} saving={saving} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-5 h-5 text-primary" />
            <p className="font-heading text-lg font-semibold">{t('clinical.history_title')}</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="flex gap-2 mb-4">
                {[
                  { v: 'all', l: t('clinical.filter_all') },
                  { v: 'hbi', l: t('clinical.hbi_name') },
                  { v: 'partial_mayo', l: t('clinical.mayo_name') },
                ].map((f) => (
                  <button
                    key={f.v}
                    onClick={() => setFilter(f.v)}
                    className={cn('px-3 py-1.5 rounded-full text-sm border transition-colors', filter === f.v ? 'border-primary bg-primary/5 text-foreground font-medium' : 'border-border text-muted-foreground')}
                  >
                    {f.l}
                  </button>
                ))}
              </div>
              <ClinicalIndexHistory items={items} filter={filter} onDelete={handleDelete} lang={lang} />
            </>
          )}
        </div>
      </MagazineEssay>
      <EditorialBlock sectionKey="visita_clinical" align="left" />
      <PremiumPaywall open={showPaywall} onClose={() => setShowPaywall(false)} />
      <RegisterNudge open={showNudge} onClose={() => setShowNudge(false)} />
    </AppLayout>
  );
}