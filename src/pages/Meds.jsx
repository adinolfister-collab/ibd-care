import React, { useEffect, useState } from 'react';
import { Plus, Pill, Trash2, Pencil, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EmptyState from '@/components/EmptyState';
import EntityFormDialog from '@/components/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const types = [
  { value: 'farmaco_orale', label: 'Farmaco orale' },
  { value: 'iniezione', label: 'Iniezione' },
  { value: 'biologico', label: 'Biologico' },
  { value: 'integratore', label: 'Integratore' },
];
const frequencies = [
  { value: 'giornaliero', label: 'Giornaliero' },
  { value: 'settimanale', label: 'Settimanale' },
  { value: 'bisettimanale', label: 'Bisettimanale' },
  { value: 'mensile', label: 'Mensile' },
  { value: 'al_bisogno', label: 'Al bisogno' },
];

const fields = (t) => [
  { name: 'name', label: t('meds.name'), type: 'text' },
  { name: 'type', label: t('meds.type'), type: 'select', options: types },
  { name: 'dosage', label: t('meds.dosage'), type: 'text' },
  { name: 'frequency', label: t('meds.frequency'), type: 'select', options: frequencies },
  { name: 'times', label: t('meds.times') + ' (es. 08:00, 20:00)', type: 'text' },
  { name: 'start_date', label: 'Data inizio', type: 'date' },
  { name: 'active', label: t('meds.active'), type: 'checkbox' },
  { name: 'notes', label: t('common.notes'), type: 'textarea' },
];

const typeColors = {
  farmaco_orale: 'bg-sky-50 text-sky-600',
  iniezione: 'bg-violet-50 text-violet-600',
  biologico: 'bg-emerald-50 text-emerald-600',
  integratore: 'bg-amber-50 text-amber-600',
};

export default function Meds() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Medication.list('-created_date', 200);
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing({ active: true }); setOpen(true); };
  const openEdit = (item) => { setEditing(item); setOpen(true); };

  const handleSubmit = async (data) => {
    if (editing?.id) await base44.entities.Medication.update(editing.id, data);
    else await base44.entities.Medication.create(data);
    setOpen(false); load();
  };
  const handleDelete = async (id) => { await base44.entities.Medication.delete(id); load(); };

  return (
    <AppLayout>
      <PageHeader
        title={t('meds.title')}
        subtitle={t('meds.subtitle')}
        action={<Button onClick={openNew} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" />{t('meds.add')}</Button>}
      />
      <PageEditorial pageKey="meds" />
      {loading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <EmptyState icon={Pill} title={t('common.empty')} description={t('meds.subtitle')} />
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <Card key={m.id} className={cn('border-0 shadow-sm', !m.active && 'opacity-60')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', typeColors[m.type] || 'bg-accent')}>
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{m.name}</p>
                      <p className="text-sm text-muted-foreground">{labelFor(types, m.type)}{m.dosage ? ' · ' + m.dosage : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4" /> {m.times || '—'}
                  </span>
                  <span className="text-muted-foreground">· {labelFor(frequencies, m.frequency)}</span>
                  {m.active && <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium ml-auto">Attivo</span>}
                </div>
                {m.notes && <p className="text-sm text-muted-foreground mt-3">{m.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EntityFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing?.id ? t('common.edit') : t('meds.add')}
        submitLabel={t('common.save')}
        fields={fields(t)}
        initialData={editing}
        onSubmit={handleSubmit}
      />
    </AppLayout>
  );
}

function labelFor(opts, v) {
  const o = opts.find((x) => x.value === v);
  return o ? o.label : v || '—';
}