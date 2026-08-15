import React, { useEffect, useState } from 'react';
import { Plus, FileText, Trash2, Pencil, ExternalLink, Stethoscope, FlaskConical, CalendarClock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import EntityFormDialog from '@/components/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.MedicalRecord.list('-record_date', 200);
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

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
      {loading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title={t('common.empty')} description={t('records.subtitle')} />
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
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
    </AppLayout>
  );
}

function labelFor(opts, v) { const o = opts.find((x) => x.value === v); return o ? o.label : v || '—'; }
function formatDate(d) { try { return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } }