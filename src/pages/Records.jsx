import React, { useEffect, useMemo, useState } from 'react';
import { Plus, FileText, Trash2, Pencil, ExternalLink, Stethoscope, FlaskConical, CalendarClock, Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import EmptyState from '@/components/EmptyState';
import EntityFormDialog from '@/components/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const types = [
  { value: 'visita', label: 'Visita' },
  { value: 'esame', label: 'Esame' },
  { value: 'esame_sangue', label: 'Esame del sangue' },
  { value: 'referto', label: 'Referto' },
  { value: 'controllo', label: 'Controllo clinico' },
];

const fields = (t) => [
  { name: 'record_date', label: t('common.date'), type: 'date' },
  { name: 'type', label: t('records.type'), type: 'select', options: types },
  { name: 'title', label: 'Titolo', type: 'text' },
  { name: 'provider', label: t('records.provider'), type: 'text' },
  { name: 'location', label: t('records.location'), type: 'text' },
  { name: 'result_summary', label: t('records.result'), type: 'textarea' },
  { name: 'report_file_url', label: t('records.report'), type: 'file' },
  { name: 'next_appointment', label: t('records.next'), type: 'date' },
  { name: 'notes', label: t('common.notes'), type: 'textarea' },
];

const typeIcon = { visita: Stethoscope, esame: FileText, esame_sangue: FlaskConical, referto: FileText, controllo: CalendarClock };
const typeColors = {
  visita: 'bg-primary/10 text-primary',
  esame: 'bg-sky-50 text-sky-600',
  esame_sangue: 'bg-rose-50 text-rose-500',
  referto: 'bg-violet-50 text-violet-600',
  controllo: 'bg-amber-50 text-amber-600',
};

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function Records() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [locFilter, setLocFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.MedicalRecord.list('-record_date', 200);
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const lf = locFilter.trim().toLowerCase();
    return items.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (dateFrom && (r.record_date || '') < dateFrom) return false;
      if (dateTo && (r.record_date || '') > dateTo) return false;
      if (lf && !(r.location || '').toLowerCase().includes(lf) && !(r.provider || '').toLowerCase().includes(lf)) return false;
      if (q) {
        const blob = [r.title, r.provider, r.location, r.result_summary, r.notes].filter(Boolean).join(' ').toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, typeFilter, dateFrom, dateTo, locFilter]);

  const hasFilters = !!(search || typeFilter !== 'all' || dateFrom || dateTo || locFilter);
  const resetFilters = () => { setSearch(''); setTypeFilter('all'); setDateFrom(''); setDateTo(''); setLocFilter(''); };

  const openNew = () => { setEditing({ record_date: todayStr() }); setOpen(true); };
  const openEdit = (item) => { setEditing(item); setOpen(true); };

  const handleSubmit = async (data) => {
    if (editing?.id) await base44.entities.MedicalRecord.update(editing.id, data);
    else await base44.entities.MedicalRecord.create(data);
    setOpen(false); load();
  };
  const handleDelete = async (id) => { await base44.entities.MedicalRecord.delete(id); load(); };

  return (
    <AppLayout>
      <PageHeader
        title={t('records.title')}
        subtitle={t('records.subtitle')}
        action={<Button onClick={openNew} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" />{t('records.add')}</Button>}
      />
      <PageEditorial pageKey="records" />

      {/* Search & advanced filters */}
      <Card className="border-0 shadow-sm mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca referti per titolo, medico, struttura o note…"
              className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="rounded-xl bg-background text-sm"><SelectValue placeholder="Tutti i tipi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                {types.map((tp) => (<SelectItem key={tp.value} value={tp.value}>{tp.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <input
              value={locFilter}
              onChange={(e) => setLocFilter(e.target.value)}
              placeholder="Nome struttura o medico"
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground">Dal</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Al</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          {hasFilters && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{filtered.length} referti trovati</span>
              <button onClick={resetFilters} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" /> Azzera filtri
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title={hasFilters ? 'Nessun referto corrisponde ai filtri' : t('common.empty')} description={hasFilters ? 'Modifica la ricerca o azzera i filtri.' : t('records.subtitle')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const Icon = typeIcon[r.type] || FileText;
            return (
              <Card key={r.id} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', typeColors[r.type] || 'bg-accent')}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{r.title}</p>
                        <p className="text-sm text-muted-foreground">{labelFor(types, r.type)} · {formatDate(r.record_date)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {(r.provider || r.location) && <p className="text-sm text-muted-foreground mt-3">{[r.provider, r.location].filter(Boolean).join(' · ')}</p>}
                  {r.result_summary && <p className="text-base mt-2 whitespace-pre-wrap">{r.result_summary}</p>}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    {r.report_file_url && (
                      <a href={r.report_file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                        <ExternalLink className="w-4 h-4" /> {t('records.report')}
                      </a>
                    )}
                    {r.next_appointment && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
                        <CalendarClock className="w-4 h-4" /> {t('records.next')}: {formatDate(r.next_appointment)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EntityFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing?.id ? t('common.edit') : t('records.add')}
        submitLabel={t('common.save')}
        fields={fields(t)}
        initialData={editing}
        onSubmit={handleSubmit}
      />
      <EditorialBlock sectionKey="records_archive" align="right" />
    </AppLayout>
  );
}

function labelFor(opts, v) { const o = opts.find((x) => x.value === v); return o ? o.label : v || '—'; }
function formatDate(d) { try { return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } }