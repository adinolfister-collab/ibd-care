import React, { useEffect, useState } from 'react';
import { Plus, Utensils, Trash2, Pencil, BookMarked } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MealTemplateManager from '@/components/MealTemplateManager';
import DietaryTips from '@/components/DietaryTips';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import EntityFormDialog from '@/components/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import PullToRefresh from '@/components/PullToRefresh';

const mealTypes = [
  { value: 'colazione', label: 'Colazione' },
  { value: 'pranzo', label: 'Pranzo' },
  { value: 'cena', label: 'Cena' },
  { value: 'spuntino', label: 'Spuntino' },
];
const reactions = [
  { value: 'nessuna', label: 'Nessuna reazione' },
  { value: 'lieve', label: 'Lieve' },
  { value: 'moderata', label: 'Moderata' },
  { value: 'severa', label: 'Severa' },
];

const fields = (t) => [
  { name: 'entry_date', label: t('common.date'), type: 'date' },
  { name: 'meal_type', label: t('food.meal_type'), type: 'select', options: mealTypes },
  { name: 'foods', label: t('food.foods'), type: 'textarea' },
  { name: 'reaction', label: t('food.reaction'), type: 'select', options: reactions },
  { name: 'tolerated', label: t('food.tolerated'), type: 'checkbox' },
  { name: 'notes', label: t('common.notes'), type: 'textarea' },
];

function todayStr() { return new Date().toISOString().slice(0, 10); }

const reactionTone = { nessuna: 'text-emerald-600', lieve: 'text-amber-600', moderata: 'text-orange-600', severa: 'text-rose-500' };

export default function Food() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [tplMgrOpen, setTplMgrOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.FoodEntry.list('-entry_date', 200);
    setItems(data);
    setLoading(false);
  };
  const refresh = async () => {
    const data = await base44.entities.FoodEntry.list('-entry_date', 200);
    setItems(data);
  };
  const loadTemplates = async () => {
    const data = await base44.entities.MealTemplate.list('-created_date', 100);
    setTemplates(data);
  };
  useEffect(() => { load(); loadTemplates(); }, []);

  const openNew = () => { setEditing({ entry_date: todayStr(), tolerated: true }); setOpen(true); };
  const openEdit = (item) => { setEditing(item); setOpen(true); };

  const handleSubmit = (data) => {
    setOpen(false);
    if (editing?.id) {
      const previous = items.find((it) => it.id === editing.id) || editing;
      setItems((prev) => prev.map((it) => (it.id === editing.id ? { ...it, ...data } : it)));
      base44.entities.FoodEntry.update(editing.id, data).catch(() => {
        setItems((prev) => prev.map((it) => (it.id === editing.id ? previous : it)));
        toast({ title: 'Errore', description: 'Modifica non salvata, riprova.', variant: 'destructive' });
      });
    } else {
      const tempId = `temp_${Date.now()}`;
      setItems((prev) => [{ ...data, id: tempId }, ...prev]);
      base44.entities.FoodEntry.create(data)
        .then((created) => setItems((prev) => prev.map((it) => (it.id === tempId ? created : it))))
        .catch(() => {
          setItems((prev) => prev.filter((it) => it.id !== tempId));
          toast({ title: 'Errore', description: 'Aggiunta non riuscita, riprova.', variant: 'destructive' });
        });
    }
  };
  const handleDelete = async (id) => { await base44.entities.FoodEntry.delete(id); load(); };
  const openFromTemplate = (tpl) => {
    setEditing({ entry_date: todayStr(), meal_type: tpl.meal_type, foods: tpl.foods, notes: tpl.notes || '', tolerated: true });
    setOpen(true);
  };
  const saveTemplate = async (data) => { await base44.entities.MealTemplate.create(data); loadTemplates(); };
  const updateTemplate = async (id, data) => { await base44.entities.MealTemplate.update(id, data); loadTemplates(); };
  const deleteTemplate = async (id) => { await base44.entities.MealTemplate.delete(id); loadTemplates(); };

  // group by date
  const grouped = items.reduce((acc, it) => {
    (acc[it.entry_date] = acc[it.entry_date] || []).push(it);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <AppLayout>
      <PageHeader
        title={t('food.title')}
        subtitle={t('food.subtitle')}
        action={
          <div className="flex gap-2">
            <Button onClick={() => setTplMgrOpen(true)} variant="outline" className="rounded-xl"><BookMarked className="w-4 h-4 mr-1.5" />{t('food.templates')}</Button>
            <Button onClick={openNew} className="rounded-xl"><Plus className="w-4 h-4 mr-1.5" />{t('food.add')}</Button>
          </div>
        }
      />
      {templates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {templates.map((tpl) => (
            <button key={tpl.id} onClick={() => openFromTemplate(tpl)} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-accent text-accent-foreground text-sm hover:bg-accent/70 transition-colors">
              <BookMarked className="w-3.5 h-3.5 text-primary" />
              <span>{tpl.name}</span>
            </button>
          ))}
        </div>
      )}
      <PullToRefresh onRefresh={refresh}>
      {loading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <EmptyState icon={Utensils} title={t('common.empty')} description={t('food.subtitle')} />
      ) : (
        <div className="space-y-6">
          {dates.map((d) => (
            <div key={d}>
              <p className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0">{formatDate(d)}</p>
              <div className="space-y-3">
                {grouped[d].map((it) => (
                  <Card key={it.id} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium bg-accent text-accent-foreground px-2.5 py-1 rounded-full capitalize">{it.meal_type || '—'}</span>
                          {it.reaction && <span className={cn('text-xs font-medium', reactionTone[it.reaction])}>· {labelFor(it.reaction)}</span>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(it)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(it.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <p className="mt-3 text-base whitespace-pre-wrap">{it.foods}</p>
                      {it.notes && <p className="text-sm text-muted-foreground mt-2">{it.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </PullToRefresh>

      <div className="mt-6">
        <DietaryTips />
      </div>

      <EntityFormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing?.id ? t('common.edit') : t('food.add')}
        submitLabel={t('common.save')}
        fields={fields(t)}
        initialData={editing}
        onSubmit={handleSubmit}
      />
      <MealTemplateManager
        open={tplMgrOpen}
        onOpenChange={setTplMgrOpen}
        templates={templates}
        onCreate={saveTemplate}
        onUpdate={updateTemplate}
        onDelete={deleteTemplate}
      />
    </AppLayout>
  );
}

function labelFor(v) {
  const m = { nessuna: 'Nessuna reazione', lieve: 'Lieve', moderata: 'Moderata', severa: 'Severa' };
  return m[v] || v;
}
function formatDate(d) {
  try { return new Date(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return d; }
}