import React, { useState } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

const REC_TYPES = ['visita', 'esame', 'esame_sangue', 'referto', 'controllo'];
const BLOOD_CATS = ['esame_sangue', 'calprotectina'];
const MED_TYPES = ['farmaco_orale', 'iniezione', 'biologico', 'integratore'];
const MED_FREQ = ['giornaliero', 'settimanale', 'bisettimanale', 'mensile', 'al_bisogno'];

function todayStr() { return new Date().toISOString().slice(0, 10); }

// Form di revisione per referti medici estratti da Cary (scanner smart).
// Se il documento e' una terapia (record_type=terapia con medication), salva
// un Medication; altrimenti un MedicalRecord. Controlla i duplicati restituiti
// da scanMedicalDocument e blocca il salvataggio se gia' presente.
export default function MedicalReviewForm({ extracted, duplicate, fileUrl, onSaved, onCancel }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user } = useAuth();
  const isTherapy = extracted && extracted.record_type === 'terapia' && extracted.medication && extracted.medication.name;
  const [saving, setSaving] = useState(false);

  const [rec, setRec] = useState(() => ({
    type: (extracted && REC_TYPES.includes(extracted.record_type) ? extracted.record_type : 'referto'),
    exam_category: (extracted && extracted.exam_category) || 'esame_sangue',
    record_date: (extracted && extracted.record_date) || todayStr(),
    title: (extracted && extracted.title) || '',
    provider: (extracted && extracted.provider) || '',
    location: (extracted && extracted.location) || '',
    findings: (extracted && extracted.findings) || '',
    result_summary: (extracted && extracted.result_summary) || '',
    next_appointment: (extracted && extracted.next_appointment) || '',
    markers: Array.isArray(extracted && extracted.markers) ? extracted.markers : [],
  }));

  const [med, setMed] = useState(() => ({
    name: (extracted && extracted.medication && extracted.medication.name) || '',
    type: (extracted && extracted.medication && extracted.medication.type) || 'farmaco_orale',
    dosage: (extracted && extracted.medication && extracted.medication.dosage) || '',
    frequency: (extracted && extracted.medication && extracted.medication.frequency) || 'giornaliero',
    start_date: (extracted && extracted.medication && extracted.medication.start_date) || todayStr(),
    notes: (extracted && extracted.medication && extracted.medication.notes) || '',
  }));

  const setR = (k, v) => setRec((p) => ({ ...p, [k]: v }));
  const setM = (k, v) => setMed((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (duplicate && duplicate.exists) {
      toast({ title: t('exams.duplicate'), description: t('exams.duplicate_hint'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (isTherapy) {
        await base44.entities.Medication.create({
          name: med.name || t('exams.title'),
          type: MED_TYPES.includes(med.type) ? med.type : 'farmaco_orale',
          dosage: med.dosage,
          frequency: MED_FREQ.includes(med.frequency) ? med.frequency : 'giornaliero',
          start_date: med.start_date || todayStr(),
          active: true,
          notes: med.notes || '',
        });
        onSaved && onSaved(t('import.therapy_saved'));
        return;
      }
      const payload = {
        record_date: rec.record_date || todayStr(),
        type: rec.type,
        title: rec.title || t('exams.title'),
        provider: rec.provider,
        location: rec.location,
        result_summary: rec.result_summary,
        findings: rec.findings,
        report_file_url: fileUrl || '',
        markers: rec.type === 'esame_sangue' ? rec.markers : [],
        next_appointment: rec.next_appointment || undefined,
      };
      if (rec.type === 'esame_sangue') payload.exam_category = rec.exam_category || 'esame_sangue';
      await base44.entities.MedicalRecord.create(payload);
      onSaved && onSaved(t('import.record_saved'));
    } catch (err) {
      toast({ title: t('common.error'), description: String(err && err.message || err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 space-y-4">
        {duplicate && duplicate.exists && (
          <div className="flex items-start gap-2 rounded-xl border-l-4 border-l-amber-400 bg-amber-50/60 px-3 py-2.5">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-600">{t('exams.duplicate')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('exams.duplicate_hint')}</p>
            </div>
          </div>
        )}

        <p className="font-semibold">{isTherapy ? t('import.review_therapy') : t('import.review_record')}</p>

        {isTherapy ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">{t('meds.name')}</label>
              <input value={med.name} onChange={(e) => setM('name', e.target.value)} className={inputCls + ' mt-1'} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">{t('meds.type')}</label>
                <Select value={med.type} onValueChange={(v) => setM('type', v)}>
                  <SelectTrigger className="mt-1 rounded-xl bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>{MED_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t('meds.type_' + ty)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('meds.dosage')}</label>
                <input value={med.dosage} onChange={(e) => setM('dosage', e.target.value)} className={inputCls + ' mt-1'} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('meds.frequency')}</label>
                <Select value={med.frequency} onValueChange={(v) => setM('frequency', v)}>
                  <SelectTrigger className="mt-1 rounded-xl bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>{MED_FREQ.map((f) => <SelectItem key={f} value={f}>{t('meds.freq_' + f)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('common.date')}</label>
                <input type="date" value={med.start_date} onChange={(e) => setM('start_date', e.target.value)} className={inputCls + ' mt-1'} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t('common.notes')}</label>
              <textarea value={med.notes} onChange={(e) => setM('notes', e.target.value)} rows={2} className={inputCls + ' mt-1'} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">{t('exams.document_type')}</label>
                <Select value={rec.type} onValueChange={(v) => setR('type', v)}>
                  <SelectTrigger className="mt-1 rounded-xl bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>{REC_TYPES.map((ty) => <SelectItem key={ty} value={ty}>{t('exams.type_' + ty)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {rec.type === 'esame_sangue' && (
                <div>
                  <label className="text-xs text-muted-foreground">{t('exams.exam_category')}</label>
                  <Select value={rec.exam_category || 'esame_sangue'} onValueChange={(v) => setR('exam_category', v)}>
                    <SelectTrigger className="mt-1 rounded-xl bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>{BLOOD_CATS.map((c) => <SelectItem key={c} value={c}>{t('exams.cat_' + c)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground">{t('exams.title_field')}</label>
                <input value={rec.title} onChange={(e) => setR('title', e.target.value)} className={inputCls + ' mt-1'} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('common.date')}</label>
                <input type="date" value={rec.record_date} onChange={(e) => setR('record_date', e.target.value)} className={inputCls + ' mt-1'} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground">{t('records.provider')}</label>
                <input value={rec.provider} onChange={(e) => setR('provider', e.target.value)} className={inputCls + ' mt-1'} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t('exams.result_summary')}</label>
              <textarea value={rec.result_summary} onChange={(e) => setR('result_summary', e.target.value)} rows={2} className={inputCls + ' mt-1'} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t('exams.findings')}</label>
              <textarea value={rec.findings} onChange={(e) => setR('findings', e.target.value)} rows={4} className={inputCls + ' mt-1'} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t('exams.next_appointment')}</label>
              <input type="date" value={rec.next_appointment} onChange={(e) => setR('next_appointment', e.target.value)} className={inputCls + ' mt-1'} />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={save} disabled={saving || (duplicate && duplicate.exists)} className="rounded-xl flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            {isTherapy ? t('import.save_therapy') : t('exams.save')}
          </Button>
          <Button variant="outline" onClick={onCancel} className="rounded-xl">{t('common.cancel')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}