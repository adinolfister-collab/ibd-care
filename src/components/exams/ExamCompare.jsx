import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Download, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/EmptyState';
import { exportExamComparison } from '@/lib/examPdf';
import { cn } from '@/lib/utils';
import { localeForLang } from '@/lib/enumLabels';

const CATS = ['esame_sangue', 'calprotectina', 'colonscopia', 'ecografia'];
const NUMERIC = new Set(['esame_sangue', 'calprotectina']);
const flagColor = { high: 'text-rose-500', low: 'text-amber-500', normal: 'text-emerald-600' };
const parseNum = (s) => { if (s == null) return null; const n = parseFloat(String(s).replace(/[<>≥≤]/g, '')); return isFinite(n) ? n : null; };
function fmt(d, lang) { try { return new Date(d).toLocaleDateString(localeForLang(lang), { day: '2-digit', month: 'short', year: '2-digit' }); } catch { return d || '—'; } }

export default function ExamCompare({ reloadKey }) {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState('esame_sangue');
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [marker, setMarker] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const data = await base44.entities.MedicalRecord.list('-record_date', 500); setAll(data.filter((r) => r.exam_category)); }
    catch (e) { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, [reloadKey]);

  const rows = useMemo(() => all.filter((r) => r.exam_category === cat).sort((a, b) => (a.record_date || '').localeCompare(b.record_date || '')), [all, cat]);
  useEffect(() => { setSelected(new Set(rows.map((r) => r.id))); }, [cat]);

  const selRows = useMemo(() => rows.filter((r) => selected.has(r.id)), [rows, selected]);
  const markers = useMemo(() => {
    const set = new Set();
    selRows.forEach((r) => (r.markers || []).forEach((m) => m.name && set.add(m.name)));
    return Array.from(set);
  }, [selRows]);
  useEffect(() => { if (markers.length && !markers.includes(marker)) setMarker(markers[0]); }, [markers]);

  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selRows.length === rows.length ? new Set() : new Set(rows.map((r) => r.id)));

  const chartData = useMemo(() => selRows.map((r) => {
    const m = (r.markers || []).find((mk) => mk.name === marker);
    return { date: fmt(r.record_date, lang), value: m ? parseNum(m.value) : null, unit: m?.unit || '' };
  }).filter((d) => d.value != null), [selRows, marker]);

  const exportPdf = () => {
    setBusy(true);
    try { exportExamComparison({ categoryLabel: t('exams.cat_' + cat), rows: selRows }); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /><span className="text-sm">{t('common.loading')}</span></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="rounded-xl bg-background w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{t('exams.cat_' + c)}</SelectItem>)}</SelectContent>
        </Select>
        {rows.length > 0 && (
          <Button variant="outline" onClick={exportPdf} disabled={!selRows.length || busy} className="rounded-xl ml-auto">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
            {t('exams.export_pdf')}
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={FileText} title={t('exams.compare_empty')} description={t('exams.scan_hint')} />
      ) : (
        <>
          <Card className="border-0 shadow-sm"><CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{t('exams.select_exams')} ({selRows.length}/{rows.length})</p>
              <button onClick={toggleAll} className="text-xs text-primary font-medium">{selRows.length === rows.length ? t('exams.deselect_all') : t('exams.select_all')}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {rows.map((r) => (
                <label key={r.id} className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors', selected.has(r.id) ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground')}>
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="accent-primary" />
                  <span>{fmt(r.record_date, lang)} · {r.title}</span>
                </label>
              ))}
            </div>
          </CardContent></Card>

          {NUMERIC.has(cat) && selRows.length > 0 && markers.length > 0 && (
            <>
              <Card className="border-0 shadow-sm"><CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">{t('exams.select_marker')}</label>
                  <Select value={marker} onValueChange={setMarker}>
                    <SelectTrigger className="rounded-xl bg-background w-full sm:w-64 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{markers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {chartData.length >= 1 ? (
                  <div className="h-64 -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={44} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Line type="monotone" dataKey="value" stroke="hsl(174 40% 34%)" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-sm text-muted-foreground">{t('exams.no_chart_data')}</p>}
              </CardContent></Card>

              <Card className="border-0 shadow-sm overflow-x-auto"><CardContent className="p-4">
                <p className="text-sm font-medium mb-3">{t('exams.table_title')}</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="py-2 pr-3 font-medium">{t('common.date')}</th>
                      {markers.map((m) => <th key={m} className="py-2 px-2 font-medium">{m}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {selRows.map((r) => (
                      <tr key={r.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{fmt(r.record_date, lang)}</td>
                        {markers.map((m) => {
                          const mk = (r.markers || []).find((x) => x.name === m);
                          return <td key={m} className={cn('py-2 px-2', mk?.flag ? flagColor[mk.flag] : 'text-muted-foreground')}>
                            {mk ? `${mk.value}${mk.unit ? ' ' + mk.unit : ''}` : '—'}
                          </td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent></Card>
            </>
          )}

          {!NUMERIC.has(cat) && selRows.length > 0 && (
            <Card className="border-0 shadow-sm"><CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">{t('exams.timeline_label')}</p>
              {selRows.map((r) => (
                <div key={r.id} className="border-l-2 border-primary/40 pl-3">
                  <p className="text-xs text-muted-foreground">{fmt(r.record_date, lang)} · {r.title}</p>
                  {r.findings && <p className="text-sm mt-1 whitespace-pre-line">{r.findings}</p>}
                  {r.result_summary && !r.findings && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{r.result_summary}</p>}
                </div>
              ))}
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}