import React, { useState, useRef } from 'react';
import { Upload, Loader2, FileText, CheckCircle2, AlertCircle, FilePlus2, Stethoscope, FlaskConical, Pill, CalendarClock, ArrowRight, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useGuestSaveGate } from '@/hooks/useGuestSaveGate';
import { trackTrialFeature } from '@/lib/trialTracking';
import SavePaywall from '@/components/SavePaywall';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { localeForLang } from '@/lib/enumLabels';

const TYPE_ICON = {
  visita: Stethoscope, esame: FileText, esame_sangue: FlaskConical,
  referto: FileText, controllo: CalendarClock, terapia: Pill
};
const TYPE_COLOR = {
  visita: 'bg-primary/10 text-primary',
  esame: 'bg-sky-50 text-sky-600',
  esame_sangue: 'bg-rose-50 text-rose-500',
  referto: 'bg-violet-50 text-violet-600',
  controllo: 'bg-amber-50 text-amber-600',
  terapia: 'bg-emerald-50 text-emerald-600'
};

function fmt(d, lang) {
  try { return new Date(d).toLocaleDateString(localeForLang(lang), { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d || '—'; }
}

export default function ImportData({ onSaved }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { attemptSave, showPaywall, setShowPaywall } = useGuestSaveGate();
  const inputRef = useRef(null);
  const [jobs, setJobs] = useState([]); // { id, file, status, error, record, type }
  const [busy, setBusy] = useState(false);

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (!isAuthenticated && !attemptSave('cloud')) return;
    trackTrialFeature('exam_import', 'used');
    setBusy(true);
    const start = files.map((f) => ({ id: Math.random().toString(36).slice(2), file: f, status: 'scanning' }));
    setJobs((cur) => [...start, ...cur]);

    for (const job of start) {
      try {
        const up = await base44.integrations.Core.UploadFile({ file: job.file });
        const url = up.file_url;
        updateJob(job.id, { status: 'scanning', url });
        const res = await base44.functions.invoke('scanMedicalDocument', { file_url: url });
        const ex = res.data?.extracted || {};
        const dup = res.data?.duplicate;
        if (dup && dup.exists) {
          let existing = null;
          try { existing = await base44.entities.MedicalRecord.get(dup.record_id); } catch (_) {}
          updateJob(job.id, { status: 'skipped', type: ex.record_type, record: existing || { id: dup.record_id, title: ex.title, record_date: ex.record_date }, duplicateReason: dup.reason });
          continue;
        }
        updateJob(job.id, { status: 'saving' });

        const rtype = (ex.record_type || 'referto').trim();
        const today = new Date().toISOString().slice(0, 10);
        const date = ex.record_date || today;

        let saved;
        if (rtype === 'terapia' && ex.medication && ex.medication.name) {
          const med = ex.medication;
          saved = await base44.entities.Medication.create({
            name: med.name,
            type: med.type || 'farmaco_orale',
            dosage: med.dosage || '',
            frequency: med.frequency || 'al_bisogno',
            times: '',
            start_date: med.start_date || date || today,
            active: true,
            notes: med.notes || ''
          });
        } else {
          saved = await base44.entities.MedicalRecord.create({
            record_date: date,
            type: rtype,
            exam_category: ['esame_sangue', 'calprotectina', 'colonscopia', 'ecografia'].includes(ex.exam_category) ? ex.exam_category : (rtype === 'esame_sangue' ? 'esame_sangue' : ''),
            title: ex.title || job.file.name.replace(/\.[^.]+$/, ''),
            provider: ex.provider || '',
            location: ex.location || '',
            result_summary: ex.result_summary || '',
            findings: ex.findings || '',
            markers: Array.isArray(ex.markers) ? ex.markers.filter((m) => m && m.name) : [],
            report_file_url: url,
            next_appointment: ex.next_appointment || ''
          });
        }
        updateJob(job.id, { status: 'saved', record: saved, type: rtype });
        try { base44.analytics.track({ eventName: 'medical_document_imported', properties: { section: rtype } }); } catch (_) {}
        onSaved && onSaved();
      } catch (err) {
        updateJob(job.id, { status: 'error', error: err.message || 'Errore' });
      }
    }
    setBusy(false);
  };

  const updateJob = (id, patch) => setJobs((cur) => cur.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  const recent = jobs
    .filter((j) => j.status === 'saved' && j.record)
    .sort((a, b) => (b.record.record_date || b.record.start_date || '').localeCompare(a.record.record_date || a.record.start_date || ''));

  return (
    <div className="space-y-4">
      <SavePaywall open={showPaywall} onClose={() => setShowPaywall(false)} />
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="font-heading text-lg font-semibold text-primary">{t('import.title')}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">{t('import.hint')}</p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary/60'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary/60'); }}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary/60'); addFiles(e.dataTransfer.files); }}
            className="rounded-xl border-2 border-dashed border-input bg-background px-4 py-8 text-center transition-colors hover:border-primary/50"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => addFiles(e.target.files)}
              className="hidden"
              id="import-files"
            />
            <label htmlFor="import-files" className="inline-flex flex-col items-center gap-2 cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <FilePlus2 className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-primary">{t('import.drop')}</span>
              <span className="text-xs text-muted-foreground">{t('import.select')}</span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('import.privacy')}</p>
        </CardContent>
      </Card>

      {jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((j) => {
            const Icon = TYPE_ICON[j.type] || FileText;
            const color = TYPE_COLOR[j.type] || 'bg-accent text-muted-foreground';
            return (
              <Card key={j.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{j.record?.title || j.record?.name || j.file?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {j.status === 'saved' && (j.record?.record_date || j.record?.start_date) ? fmt(j.record.record_date || j.record.start_date, lang) : j.file?.name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        {j.status === 'saved' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                            {t('import.section')}: {t('import.type_' + j.type) || j.type}
                          </span>
                        )}
                        {j.status === 'error' && (
                          <span className="text-xs text-rose-500">{t('import.error')}: {j.error}</span>
                        )}
                        {j.status === 'skipped' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <Archive className="w-3 h-3" /> {t('import.duplicate')} · {j.duplicateReason}
                          </span>
                        )}
                      </div>
                      {j.status === 'saved' && Array.isArray(j.record?.markers) && j.record.markers.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {j.record.markers.slice(0, 4).map((m) => `${m.name} ${m.value}${m.unit ? ' ' + m.unit : ''}`).join(' · ')}
                        </p>
                      )}
                      {j.status === 'skipped' && (
                        <p className="text-xs text-muted-foreground mt-1.5">{t('import.duplicate_hint')}</p>
                      )}
                    </div>
                    <StatusBadge status={j.status} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-heading font-semibold text-primary">{t('import.recent')}</p>
              <button onClick={() => navigate('/records')} className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                {t('import.open_archive')} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {recent.slice(0, 8).map((j) => {
                const d = j.record.record_date || j.record.start_date;
                return (
                  <div key={j.id} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{fmt(d, lang)}</span>
                    <span className={cn('h-1.5 w-1.5 rounded-full', TYPE_COLOR[j.type] ? 'bg-terracotta' : 'bg-muted-foreground')} />
                    <span className="truncate">{j.record.title || j.record.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{t('import.type_' + j.type) || j.type}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'scanning' || status === 'saving')
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />;
  if (status === 'saved') return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
  if (status === 'skipped') return <Archive className="w-5 h-5 text-amber-500 shrink-0" />;
  if (status === 'error') return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
  return null;
}