import React, { useState } from 'react';
import { Upload, Loader2, Plus, Save, Trash2, X, ScanLine } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const CAT_TYPE = { esame_sangue: 'esame_sangue', calprotectina: 'esame', colonscopia: 'esame', ecografia: 'esame' };
const CATS = ['esame_sangue', 'calprotectina', 'colonscopia', 'ecografia'];

const flagColor = { high: 'text-rose-500', low: 'text-amber-500', normal: 'text-emerald-600' };

export default function ExamScanner({ onSaved }) {
  const { t } = useI18n();
  const [category, setCategory] = useState('esame_sangue');
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [data, setData] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setScanning(true);
    setData(null);
    try {
      const up = await base44.integrations.Core.UploadFile({ file });
      const url = up.file_url;
      setFileUrl(url);
      setFileName(file.name);
      const res = await base44.functions.invoke('scanMedicalDocument', { file_url: url, exam_category: category });
      const ex = res.data?.extracted || {};
      setData({
        title: ex.title || file.name.replace(/\.[^.]+$/, ''),
        exam_date: ex.exam_date || new Date().toISOString().slice(0, 10),
        provider: ex.provider || '',
        markers: Array.isArray(ex.markers) ? ex.markers.filter((m) => m && m.name) : [],
        findings: ex.findings || '',
        summary: ex.summary || ''
      });
    } catch (err) {
      setError(err.message || 'Errore scansione');
    } finally {
      setScanning(false);
    }
  };

  const setField = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const setMarker = (i, k, v) => setData((d) => {
    const m = [...d.markers];
    m[i] = { ...m[i], [k]: v };
    return { ...d, markers: m };
  });
  const addMarker = () => setData((d) => ({ ...d, markers: [...d.markers, { name: '', value: '', unit: '', ref_low: '', ref_high: '', flag: 'normal' }] }));
  const removeMarker = (i) => setData((d) => ({ ...d, markers: d.markers.filter((_, idx) => idx !== i) }));

  const reset = () => { setData(null); setFileUrl(null); setFileName(null); setError(null); };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await base44.entities.MedicalRecord.create({
        record_date: data.exam_date || new Date().toISOString().slice(0, 10),
        type: CAT_TYPE[category],
        exam_category: category,
        title: data.title || t('exams.title'),
        provider: data.provider || '',
        result_summary: data.summary || '',
        findings: data.findings || '',
        report_file_url: fileUrl || '',
        markers: data.markers || []
      });
      reset();
      onSaved && onSaved();
    } catch (err) {
      setError(err.message || 'Errore salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const isDescriptive = category === 'colonscopia' || category === 'ecografia';

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">{t('exams.select_category')}</label>
            <Select value={category} onValueChange={(v) => { setCategory(v); reset(); }}>
              <SelectTrigger className="mt-1.5 rounded-xl bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATS.map((c) => <SelectItem key={c} value={c}>{t('exams.cat_' + c)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <label className="block">
            <span className="text-sm text-muted-foreground">{t('exams.scan_hint')}</span>
            <div className="mt-1.5 rounded-xl border-2 border-dashed border-input bg-background px-4 py-6 text-center transition-colors hover:border-primary/50">
              <input type="file" accept="image/*,application/pdf" onChange={handleFile} className="hidden" id="exam-file" />
              <label htmlFor="exam-file" className="inline-flex items-center gap-2 cursor-pointer text-primary font-medium">
                <ScanLine className="w-5 h-5" /> {t('exams.scan_hint')}
              </label>
              {fileName && <p className="text-xs text-muted-foreground mt-2 truncate">{fileName}</p>}
            </div>
          </label>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('exams.scan_privacy')}</p>
        </CardContent>
      </Card>

      {scanning && (
        <Card className="border-0 shadow-sm"><CardContent className="p-6 flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm">{t('exams.scanning')}</span>
        </CardContent></Card>
      )}

      {error && !scanning && (
        <Card className="border-0 shadow-sm border-l-4 border-l-rose-400"><CardContent className="p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-rose-500">{t('exams.scan_error')}: {error}</p>
          <Button variant="ghost" size="icon" onClick={reset}><X className="w-4 h-4" /></Button>
        </CardContent></Card>
      )}

      {data && !scanning && (
        <Card className="border-0 shadow-sm"><CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">{t('exams.title_field')}</label>
              <input value={data.title} onChange={(e) => setField('title', e.target.value)} className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t('common.date')}</label>
              <input type="date" value={data.exam_date} onChange={(e) => setField('exam_date', e.target.value)} className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">{t('records.provider')}</label>
              <input value={data.provider} onChange={(e) => setField('provider', e.target.value)} className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>

          {!isDescriptive && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{t('exams.markers')}</p>
                <button onClick={addMarker} className="inline-flex items-center gap-1 text-xs text-primary font-medium"><Plus className="w-3.5 h-3.5" /> {t('exams.add_marker')}</button>
              </div>
              {data.markers.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('exams.no_markers')}</p>
              ) : (
                <div className="space-y-2">
                  {data.markers.map((m, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={m.name} onChange={(e) => setMarker(i, 'name', e.target.value)} placeholder={t('exams.marker_name')} className="col-span-4 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                      <input value={m.value} onChange={(e) => setMarker(i, 'value', e.target.value)} placeholder={t('exams.value')} className="col-span-3 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                      <input value={m.unit} onChange={(e) => setMarker(i, 'unit', e.target.value)} placeholder={t('exams.unit')} className="col-span-2 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                      <Select value={m.flag || 'normal'} onValueChange={(v) => setMarker(i, 'flag', v)}>
                        <SelectTrigger className="col-span-2 h-8 rounded-lg bg-background text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normale</SelectItem>
                          <SelectItem value="high">Alto</SelectItem>
                          <SelectItem value="low">Basso</SelectItem>
                        </SelectContent>
                      </Select>
                      <button onClick={() => removeMarker(i)} className="col-span-1 flex justify-center text-rose-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isDescriptive && (
            <div>
              <label className="text-xs text-muted-foreground">{t('exams.findings')}</label>
              <textarea value={data.findings} onChange={(e) => setField('findings', e.target.value)} rows={5} className="w-full mt-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={saving} className="rounded-xl flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
              {t('exams.save')}
            </Button>
            <Button variant="outline" onClick={reset} className="rounded-xl"><X className="w-4 h-4 mr-1.5" /> {t('common.cancel')}</Button>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}