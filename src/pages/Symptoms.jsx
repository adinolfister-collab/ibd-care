import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Activity, Trash2, Pencil, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useSubscription } from '@/hooks/useSubscription';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EmptyState from '@/components/EmptyState';
import EntityFormDialog from '@/components/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import PullToRefresh from '@/components/PullToRefresh';

const FREE_DAILY_LIMIT = 2;

const painLocations = [
  { value: 'nessuno', label: 'Nessuno' },
  { value: 'addome_inferiore', label: 'Addome inferiore' },
  { value: 'addome_superiore', label: 'Addome superiore' },
  { value: 'fianco_dx', label: 'Fianco destro' },
  { value: 'fianco_sx', label: 'Fianco sinistro' },
  { value: 'generico', label: 'Generico' },
];

const bristol = [
  { value: 1, label: '1 — Palline dure' },
  { value: 2, label: '2 — A salsiccia' },
  { value: 3, label: '3 — A salsiccia con crepe' },
  { value: 4, label: '4 — Salsiccia liscia (normale)' },
  { value: 5, label: '5 — Pezzi morbidi' },
  { value: 6, label: '6 — A fiocchi morbidi' },
  { value: 7, label: '7 — Liquido' },
];

const moods = [
  { value: 'buono', label: 'Buono' },
  { value: 'discreto', label: 'Discreto' },
  { value: 'giu', label: 'Giù' },
  { value: 'ansia', label: 'Ansia' },
  { value: 'irritabile', label: 'Irritabile' },
];

const fields = (t) => [
  { name: 'entry_date', label: t('common.date'), type: 'date', },
  { name: 'pain_level', label: t('symptoms.pain') + ' (0–10)', type: 'slider', min: 0, max: 10 },
  { name: 'pain_location', label: t('symptoms.pain_location'), type: 'select', options: painLocations },
  { name: 'fatigue_level', label: t('symptoms.fatigue') + ' (0–10)', type: 'slider', min: 0, max: 10 },
  { name: 'bowel_movements_count', label: t('symptoms.bowel'), type: 'number', min: 0 },
  { name: 'stool_consistency', label: t('symptoms.stool') + ' (scala Bristol)', type: 'select', options: bristol },
  { name: 'blood', label: t('symptoms.blood'), type: 'checkbox' },
  { name: 'mood', label: t('symptoms.mood'), type: 'select', options: moods },
  { name: 'notes', label: t('common.notes'), type: 'textarea' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Symptoms() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const todayCount = items.filter((it) => it.entry_date === todayStr() && !String(it.id).startsWith('temp_')).length;
  const limitReached = !subLoading && !isSubscribed && todayCount >= FREE_DAILY_LIMIT;

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.SymptomEntry.list('-entry_date', 200);
    setItems(data);
    setLoading(false);
  };
  const refresh = async () => {
    const data = await base44.entities.SymptomEntry.list('-entry_date', 200);
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    if (limitReached) return;
    setEditing({ entry_date: todayStr() });
    setOpen(true);
  };
  const openEdit = (item) => { setEditing(item); setOpen(true); };

  const handleSubmit = (data) => {
    setOpen(false);
    const payload = { ...data, pain_level: data.pain_level ?? 0, fatigue_level: data.fatigue_level ?? 0 };
    if (editing?.id) {
      const previous = items.find((it) => it.id === editing.id) || editing;
      setItems((prev) => prev.map((it) => (it.id === editing.id ? { ...it, ...payload } : it)));
      base44.entities.SymptomEntry.update(editing.id, data).catch(() => {
        setItems((prev) => prev.map((it) => (it.id === editing.id ? previous : it)));
        toast({ title: 'Errore', description: 'Modifica non salvata, riprova.', variant: 'destructive' });
      });
    } else {
      const tempId = `temp_${Date.now()}`;
      setItems((prev) =>
        [{ ...payload, id: tempId }, ...prev].sort((a, b) => (b.entry_date || '').localeCompare(a.entry_date || ''))
      );
      base44.entities.SymptomEntry.create(payload)
        .then((created) => setItems((prev) => prev.map((it) => (it.id === tempId ? created : it))))
        .catch(() => {
          setItems((prev) => prev.filter((it) => it.id !== tempId));
          toast({ title: 'Errore', description: 'Aggiunta non riuscita, riprova.', variant: 'destructive' });
        });
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.SymptomEntry.delete(id);
    load();
  };

  return (
    <AppLayout>
      <PageHeader
        title={t('symptoms.title')}
        subtitle={t('symptoms.subtitle')}
        action={
          limitReached ? (
            <Link to="/abbonamento">
              <Button className="rounded-xl" variant="outline">
                <Lock className="w-4 h-4 mr-1.5" /> Passa a Premium
              </Button>
            </Link>
          ) : (
            <Button onClick={openNew} className="rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" />{t('symptoms.add')}
            </Button>
          )
        }
      />
      <PageEditorial pageKey="symptoms" />
      {limitReached && (
        <Card className="mb-4 border-amber-200 bg-amber-50 border shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Hai raggiunto il limite gratuito di {FREE_DAILY_LIMIT} inserimenti al giorno.</p>
              <p className="text-amber-700 mt-0.5">Con <Link to="/abbonamento" className="font-medium underline">IBD Care Premium</Link> registri sintomi, alimenti, farmaci e molto altro senza limiti.</p>
            </div>
          </CardContent>
        </Card>
      )}
      <PullToRefresh onRefresh={refresh}>
      {loading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <EmptyState icon={Activity} title={t('common.empty')} description={t('symptoms.subtitle')} />
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.id} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-lg">{formatDate(it.entry_date)}</p>
                    {it.blood && <span className="inline-block mt-1 text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">Sangue presente</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(it)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(it.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <Mini label={t('symptoms.pain')} value={`${it.pain_level ?? 0}/10`} tone={tone(it.pain_level)} />
                  <Mini label={t('symptoms.fatigue')} value={`${it.fatigue_level ?? 0}/10`} tone={tone(it.fatigue_level)} />
                  <Mini label={t('symptoms.bowel')} value={it.bowel_movements_count ?? 0} />
                  <Mini label={t('symptoms.stool')} value={it.stool_consistency ? `Tipo ${it.stool_consistency}` : '—'} />
                </div>
                {it.notes && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{it.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </PullToRefresh>

      <EntityFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing?.id ? t('common.edit') : t('symptoms.add')}
        submitLabel={t('common.save')}
        fields={fields(t)}
        initialData={editing}
        onSubmit={handleSubmit}
      />
    </AppLayout>
  );
}

function Mini({ label, value, tone }) {
  return (
    <div className="bg-accent/50 rounded-xl p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-semibold mt-0.5', tone)}>{value}</p>
    </div>
  );
}
function tone(v) { if (v == null) return ''; if (v >= 7) return 'text-rose-500'; if (v >= 4) return 'text-amber-600'; return 'text-emerald-600'; }
function formatDate(d) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return d; }
}