import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import FoodChecklist from '@/components/FoodChecklist';
import { useI18n } from '@/lib/i18n';
import { MEAL_TYPE_KEYS, REACTION_KEYS } from '@/lib/enumLabels';

const fieldClass = 'mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-ring';

const cookingMethods = [
  { value: 'al_vapore', labelKey: 'food.cooking_al_vapore' },
  { value: 'bollito', labelKey: 'food.cooking_bollito' },
  { value: 'al_forno', labelKey: 'food.cooking_al_forno' },
  { value: 'piastrato', labelKey: 'food.cooking_piastrato' },
  { value: 'fritto', labelKey: 'food.cooking_fritto' },
  { value: 'crudo', labelKey: 'food.cooking_crudo' },
];
function MobileSelect({ value, options, onChange, placeholder }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => String(o.value) === String(value));
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(fieldClass, 'h-12 text-base font-normal flex items-center justify-between')}
      >
        <span className={current ? 'text-foreground' : 'text-muted-foreground'}>
          {current ? current.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 opacity-50" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[60vh]">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-left text-base">{t('food.select')}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            {options.map((o) => {
              const active = String(o.value) === String(value);
              return (
                <button
                  type="button"
                  key={String(o.value)}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={cn(
                    'w-full text-left px-5 py-4 text-base border-b border-border last:border-0 flex items-center justify-between',
                    active ? 'text-primary font-medium bg-primary/5' : 'hover:bg-accent'
                  )}
                >
                  {o.label}
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

// Dialog dedicato per i pasti: usa la checklist strutturata al posto del testo
// libero per i cibi. Mantiene data / tipo / reazione / tolleranza / note come
// nel dialog generico (EntityFormDialog), con la stessa UX mobile.
export default function FoodFormDialog({ open, onOpenChange, title, submitLabel, groups, initialData, onSubmit, triggerTags }) {
  const { t } = useI18n();
  const [data, setData] = useState(initialData || {});
  const [isMobile, setIsMobile] = useState(false);

  const mealTypes = Object.entries(MEAL_TYPE_KEYS).map(([value, key]) => ({ value, label: t(key) }));
  const reactions = Object.entries(REACTION_KEYS).map(([value, key]) => ({ value, label: t(key) }));

  useEffect(() => { if (open) setData(initialData || {}); }, [open, initialData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const set = (name, value) => setData((d) => ({ ...d, [name]: value }));
  const cookingOpts = cookingMethods.map((o) => ({ ...o, label: t(o.labelKey) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  const items = data.items || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg rounded-2xl flex flex-col max-h-[88vh] gap-0 p-0"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0">
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 overflow-y-auto px-6 py-3 flex-1 min-h-0">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('common.date')}</Label>
              <Input type="date" value={data.entry_date || ''} onChange={(e) => set('entry_date', e.target.value)} className={fieldClass} />
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('food.meal_type')}</Label>
              {isMobile ? (
                <MobileSelect value={data.meal_type} options={mealTypes} onChange={(v) => set('meal_type', v)} placeholder="—" />
              ) : (
                <Select value={data.meal_type || ''} onValueChange={(v) => set('meal_type', v)}>
                  <SelectTrigger className={cn(fieldClass, 'h-12 text-base font-normal')}><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('food.cooking_method')}</Label>
              {isMobile ? (
                <MobileSelect value={data.cooking_method} options={cookingOpts} onChange={(v) => set('cooking_method', v)} placeholder={t('food.cooking_none')} />
              ) : (
                <Select value={data.cooking_method || ''} onValueChange={(v) => set('cooking_method', v)}>
                  <SelectTrigger className={cn(fieldClass, 'h-12 text-base font-normal')}><SelectValue placeholder={t('food.cooking_none')} /></SelectTrigger>
                  <SelectContent>
                    {cookingOpts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('food.foods')}</Label>
              <div className="mt-1.5">
                <FoodChecklist groups={groups} value={items} onChange={(v) => set('items', v)} />
              </div>
            </div>

            {triggerTags && triggerTags.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">{t('trigger.pick_label')}</Label>
                <p className="text-xs text-muted-foreground mb-2">{t('trigger.pick_hint')}</p>
                <div className="flex flex-wrap gap-2">
                  {(data.trigger_tags || []).length === 0 && (
                    <span className="text-xs text-muted-foreground/70">{t('trigger.none_picked')}</span>
                  )}
                  {triggerTags.map((tg) => {
                    const active = (data.trigger_tags || []).includes(tg.name);
                    return (
                      <button
                        key={tg.id}
                        type="button"
                        onClick={() => {
                          const cur = data.trigger_tags || [];
                          set('trigger_tags', active ? cur.filter((x) => x !== tg.name) : [...cur, tg.name]);
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm border transition-colors',
                          active ? 'border-terracotta bg-terracotta/15 text-accent-foreground' : 'border-border bg-card text-muted-foreground hover:border-terracotta/40'
                        )}
                      >
                        {active ? '✓ ' : ''}{tg.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('food.reaction')}</Label>
              {isMobile ? (
                <MobileSelect value={data.reaction} options={reactions} onChange={(v) => set('reaction', v)} placeholder="—" />
              ) : (
                <Select value={data.reaction || ''} onValueChange={(v) => set('reaction', v)}>
                  <SelectTrigger className={cn(fieldClass, 'h-12 text-base font-normal')}><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {reactions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('food.tolerated')}</Label>
              <button
                type="button"
                onClick={() => set('tolerated', !data.tolerated)}
                className={cn(
                  'mt-1.5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors',
                  data.tolerated ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
                )}
              >
                <span className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center', data.tolerated ? 'border-primary-foreground' : 'border-muted-foreground')}>
                  {data.tolerated && <span className="w-2 h-2 rounded-full bg-primary-foreground" />}
                </span>
                {data.tolerated ? t('food.tolerated_yes') : t('food.tolerated_no')}
              </button>
            </div>

            <div>
              <Label className="text-sm font-medium text-muted-foreground">{t('common.notes')}</Label>
              <Textarea value={data.notes || ''} onChange={(e) => set('notes', e.target.value)} className={cn(fieldClass, 'flex-1')} rows={2} />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3 px-6 pb-5 shrink-0 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" className="rounded-xl">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}