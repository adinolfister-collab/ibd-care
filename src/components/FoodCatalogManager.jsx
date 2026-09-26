import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Edit, Plus, Trash2, Check, ChevronDown, ListPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { UNITS, catalogToGroups } from '@/lib/foodCatalog';
import { useI18n } from '@/lib/i18n';
import { unitLabel } from '@/lib/enumLabels';
import { cn } from '@/lib/utils';

const fieldClass = 'mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring';

const CATEGORIES = [
  'Cereali e granaglie',
  'Proteine',
  'Verdure',
  'Frutta',
  'Latticini e alternative',
  'Condimenti',
  'Altro',
];

// Gestione del catalogo cibi (solo admin): elenco raggruppato per categoria,
// aggiunta/modifica/eliminazione di voci FoodCatalogItem condivise con tutti
// gli utenti.
export default function FoodCatalogManager({ open, onOpenChange, onChanged }) {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // {id?, name, category, default_unit}
  const [isMobile, setIsMobile] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.FoodCatalogItem.list('-created_date', 500);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const groups = useMemo(() => catalogToGroups(items.length ? items : []), [items]);

  const openNew = () => setEditing({ name: '', category: CATEGORIES[0], default_unit: 'porzione', kcal: '', proteine: '', carboidrati: '', portion_grams: '' });
  const openEdit = (it) => setEditing({ id: it.id, name: it.name, category: it.category, default_unit: it.default_unit || 'porzione', kcal: it.kcal ?? '', proteine: it.proteine ?? '', carboidrati: it.carboidrati ?? '', portion_grams: it.portion_grams ?? '' });
  const closeEdit = () => setEditing(null);

  const save = async () => {
    if (!editing?.name?.trim()) return;
    const payload = {
      name: editing.name.trim(),
      category: editing.category,
      default_unit: editing.default_unit,
      kcal: editing.kcal === '' ? null : Number(editing.kcal),
      proteine: editing.proteine === '' ? null : Number(editing.proteine),
      carboidrati: editing.carboidrati === '' ? null : Number(editing.carboidrati),
      portion_grams: editing.portion_grams === '' ? null : Number(editing.portion_grams),
    };
    try {
      if (editing.id) {
        await base44.entities.FoodCatalogItem.update(editing.id, payload);
      } else {
        await base44.entities.FoodCatalogItem.create(payload);
      }
      setEditing(null);
      await load();
      onChanged?.();
    } catch (e) {
      // lascia bubblare via console; l'utente vede il dialog aperto
      console.error(e);
    }
  };

  const remove = async (id) => {
    try { await base44.entities.FoodCatalogItem.delete(id); await load(); onChanged?.(); } catch (e) { console.error(e); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl flex flex-col max-h-[88vh] gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 flex-row items-center justify-between">
          <DialogTitle className="text-xl">{t('food.catalog_manage')}</DialogTitle>
          <Button size="sm" className="rounded-xl" onClick={openNew}>
            <Plus className="w-4 h-4 mr-1.5" />{t('food.catalog_add')}
          </Button>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-3 flex-1 min-h-0 space-y-4">
          {loading && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground italic">{t('food.catalog_empty')}</p>
          )}
          {groups.map((g) => (
            <div key={g.category}>
              <p className="font-heading text-sm font-semibold text-primary mb-1">{g.category}</p>
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border bg-card">
                {g.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 px-2.5 py-2">
                    <span className="flex-1 text-sm">{it.name}</span>
                    {it.kcal != null && (
                      <span className="text-[11px] text-terracotta font-medium">{it.kcal} {t('food.kcal_unit')}</span>
                    )}
                    {it.proteine != null && (
                      <span className="text-[11px] text-primary font-medium">{it.proteine}{t('unit.g')}</span>
                    )}
                    {it.carboidrati != null && (
                      <span className="text-[11px] text-amber-600 font-medium">{it.carboidrati}{t('unit.g')}</span>
                    )}
                    {it.portion_grams != null && (
                      <span className="text-[11px] text-muted-foreground">{it.portion_grams}{t('unit.g')}</span>
                    )}
                    {it.default_unit && (
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {unitLabel(t, it.default_unit)}
                      </span>
                    )}
                    <button onClick={() => openEdit(it)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground" aria-label={t('common.edit')}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(it.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400" aria-label={t('common.delete')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="pt-3 px-6 pb-5 shrink-0 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>

      {editing && (
        <Dialog open onOpenChange={(o) => { if (!o) closeEdit(); }}>
          <DialogContent className="max-w-sm rounded-2xl p-0" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="px-6 pt-6 pb-3">
              <DialogTitle className="text-xl">{editing.id ? t('common.edit') : t('food.catalog_add')}</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-4 space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('food.item_name')}</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={fieldClass} placeholder={t('food.placeholder_example')} />
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('food.category')}</Label>
                {isMobile ? (
                  <CategoryDrawer value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} />
                ) : (
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger className={cn(fieldClass, 'h-12 text-base font-normal')}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('food.default_unit')}</Label>
                {isMobile ? (
                  <UnitDrawer value={editing.default_unit} onChange={(v) => setEditing({ ...editing, default_unit: v })} />
                ) : (
                  <Select value={editing.default_unit} onValueChange={(v) => setEditing({ ...editing, default_unit: v })}>
                    <SelectTrigger className={cn(fieldClass, 'h-12 text-base font-normal')}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{unitLabel(t, u.value)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">{t('food.kcal_field')}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={editing.kcal ?? ''}
                    onChange={(e) => setEditing({ ...editing, kcal: e.target.value })}
                    className={fieldClass}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">{t('food.prot_field')}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={editing.proteine ?? ''}
                    onChange={(e) => setEditing({ ...editing, proteine: e.target.value })}
                    className={fieldClass}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">{t('food.carb_field')}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={editing.carboidrati ?? ''}
                    onChange={(e) => setEditing({ ...editing, carboidrati: e.target.value })}
                    className={fieldClass}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('food.portion_grams_field')}</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={editing.portion_grams ?? ''}
                  onChange={(e) => setEditing({ ...editing, portion_grams: e.target.value })}
                  className={fieldClass}
                  placeholder="0"
                />
                <p className="text-[11px] text-muted-foreground italic mt-1">{t('food.portion_grams_hint')}</p>
              </div>
              <p className="text-[11px] text-muted-foreground italic -mt-1">{t('food.nutrition_per100_hint')}</p>
            </div>
            <DialogFooter className="gap-2 px-6 pb-5 border-t border-border">
              <Button variant="ghost" onClick={closeEdit}>{t('common.cancel')}</Button>
              <Button className="rounded-xl" onClick={save} disabled={!editing.name?.trim()}>
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

function CategoryDrawer({ value, onChange }) {
  const { t } = useI18n();
  return <ListDrawer label={t('food.category')} value={value} options={CATEGORIES} onChange={onChange} />;
}
function UnitDrawer({ value, onChange }) {
  const { t } = useI18n();
  return <ListDrawer label={t('food.default_unit')} value={value} options={UNITS.map((u) => u.value)} labels={UNITS.map((u) => unitLabel(t, u.value))} onChange={onChange} />;
}

function ListDrawer({ label, value, options, labels, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(fieldClass, 'h-12 text-base font-normal flex items-center justify-between')}>
        <span className="text-foreground">{labels ? labels[options.indexOf(value)] : value}</span>
        <ChevronDown className="w-4 h-4 opacity-50" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[60vh]">
          <DrawerHeader className="text-left pb-2"><DrawerTitle className="text-left text-base">{label}</DrawerTitle></DrawerHeader>
          <div className="overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            {options.map((o, i) => {
              const active = o === value;
              return (
                <button type="button" key={o} onClick={() => { onChange(o); setOpen(false); }}
                  className={cn('w-full text-left px-5 py-4 text-base border-b border-border last:border-0 flex items-center justify-between',
                    active ? 'text-primary font-medium bg-primary/5' : 'hover:bg-accent')}>
                  {labels ? labels[i] : o}
                  {active && <Check className="w-5 h-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}