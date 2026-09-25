import React, { useEffect, useState } from 'react';
import { Loader2, Trash2, FileText, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/EmptyState';
import PremiumExportButton from '@/components/PremiumExportButton';
import { exportExamListPdf } from '@/lib/examPdf';
import { cn } from '@/lib/utils';
import { localeForLang } from '@/lib/enumLabels';

const CATS = ['all', 'esame_sangue', 'calprotectina', 'colonscopia', 'ecografia'];
const flagColor = { high: 'bg-rose-50 text-rose-500', low: 'bg-amber-50 text-amber-600', normal: 'bg-emerald-50 text-emerald-600' };
const catColor = { esame_sangue: 'bg-rose-50 text-rose-500', calprotectina: 'bg-amber-50 text-amber-600', colonscopia: 'bg-violet-50 text-violet-600', ecografia: 'bg-sky-50 text-sky-600' };

function fmt(d, lang) { try { return new Date(d).toLocaleDateString(localeForLang(lang), { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d || '—'; } }

export default function ExamTimeline({ reloadKey }) {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.MedicalRecord.list('-record_date', 400);
      setItems(data.filter((r) => r.exam_category));
    } catch (e) { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, [reloadKey]);

  const filtered = cat === 'all' ? items : items.filter((r) => r.exam_category === cat);

  const remove = async (id) => { await base44.entities.MedicalRecord.delete(id); load(); };

  if (loading) return <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /><span className="text-sm">{t('common.loading')}</span></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="rounded-xl bg-background w-full sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATS.map((c) => <SelectItem key={c} value={c}>{c === 'all' ? t('map.all') : t('exams.cat_' + c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <PremiumExportButton
          label={t('exams.export_list_pdf')}
          lockedLabel={t('exams.export_list_locked')}
          feature="exam_list_pdf"
          icon={FileText}
          onExport={() => exportExamListPdf(filtered)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title={t('exams.timeline_empty')} description={t('exams.scan_hint')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const markers = Array.isArray(r.markers) ? r.markers : [];
            return (
              <Card key={r.id} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={cn('px-2.5 py-1 rounded-full text-[11px] font-medium', catColor[r.exam_category])}>{t('exams.cat_' + r.exam_category)}</span>
                      <div>
                        <p className="font-semibold">{r.title}</p>
                        <p className="text-sm text-muted-foreground">{fmt(r.record_date, lang)}{r.provider ? ' · ' + r.provider : ''}</p>
                      </div>
                    </div>
                    <button onClick={() => remove(r.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  {markers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {markers.map((m, i) => (
                        <span key={i} className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs', flagColor[m.flag] || 'bg-accent')}>
                          <span className="font-medium">{m.name}</span>
                          <span>{m.value}{m.unit ? ' ' + m.unit : ''}</span>
                          {m.flag === 'high' && ' ↑'}{m.flag === 'low' && ' ↓'}
                        </span>
                      ))}
                    </div>
                  )}

                  {r.findings && <p className="text-sm text-foreground/90 mt-3 whitespace-pre-line">{r.findings}</p>}
                  {r.result_summary && !r.findings && <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{r.result_summary}</p>}

                  {r.report_file_url && (
                    <a href={r.report_file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mt-3">
                      <ExternalLink className="w-4 h-4" /> {t('records.report')}
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}