import React, { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EntityFormDialog from '@/components/EntityFormDialog';
import { useI18n } from '@/lib/i18n';

const mealOptions = [
  { value: 'colazione', label: 'Colazione' },
  { value: 'pranzo', label: 'Pranzo' },
  { value: 'cena', label: 'Cena' },
  { value: 'spuntino', label: 'Spuntino' },
];
const mealLabels = { colazione: 'Colazione', pranzo: 'Pranzo', cena: 'Cena', spuntino: 'Spuntino' };

export default function MealTemplateManager({ open, onOpenChange, templates, onCreate, onUpdate, onDelete }) {
  const { t } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fields = [
    { name: 'name', label: t('food.template_name'), type: 'text' },
    { name: 'meal_type', label: t('food.meal_type'), type: 'select', options: mealOptions },
    { name: 'foods', label: t('food.foods'), type: 'textarea' },
    { name: 'notes', label: t('common.notes'), type: 'textarea' },
  ];

  const handleSubmit = (data) => {
    if (editing?.id) onUpdate(editing.id, data);
    else onCreate(data);
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t('food.templates')}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-y-auto space-y-2 px-1">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">{t('food.no_templates')}</p>
            ) : (
              templates.map((tpl) => (
                <div key={tpl.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{tpl.name}</p>
                      {tpl.meal_type && <span className="text-[11px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{mealLabels[tpl.meal_type]}</span>}
                    </div>
                    <p className="text-sm mt-1 line-clamp-2 text-muted-foreground">{tpl.foods}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => { setEditing(tpl); setFormOpen(true); }} className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(tpl.id)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="rounded-xl w-full"><Plus className="w-4 h-4 mr-1.5" />{t('food.new_template')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing?.id ? t('common.edit') : t('food.new_template')}
        submitLabel={t('common.save')}
        fields={fields}
        initialData={editing}
        onSubmit={handleSubmit}
      />
    </>
  );
}