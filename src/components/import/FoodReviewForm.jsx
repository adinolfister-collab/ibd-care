import React, { useState } from 'react';
import { Save, Loader2, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

const MEALS = ['colazione', 'pranzo', 'cena', 'spuntino'];
const UNITS = ['g', 'ml', 'porzione', 'cucchiaio', 'tazza', 'fetta'];

function todayStr() { return new Date().toISOString().slice(0, 10); }

// Form di revisione per cibo estratto da Cary (etichetta nutrizionale o piatto).
// - etichetta: singolo alimento con valori per 100g -> crea un FoodEntry con
//   un item (100g) e i valori nutrizionali letti dall'etichetta. Per gli admin,
//   opzione per aggiungere l'alimento al catalogo condiviso (FoodCatalogItem).
// - piatto: piu' alimenti con valori stimati -> crea un FoodEntry con gli items.
// I valori stimati (piatto) sono sempre segnalati come 'cary'.
export default function FoodReviewForm({ category, extracted, onSaved, onCancel }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  const [date, setDate] = useState(todayStr());
  const [mealType, setMealType] = useState(
    category === 'etichetta' ? 'spuntino' : (extracted && extracted.meal_type) || 'pranzo'
  );
  const [items, setItems] = useState(() => {
    if (category === 'etichetta' && extracted) {
      return [{
        name: extracted.name || '',
        qty: '100',
        unit: extracted.default_unit || 'g',
        kcal: extracted.kcal || 0,
        proteine: extracted.proteine || 0,
        carboidrati: extracted.carboidrati || 0,
        kcal_source: 'cary',
      }];
    }
    return (extracted && extracted.items) || [];
  });
  const [toCatalog, setToCatalog] = useState(false);
  const [saving, setSaving] = useState(false);

  const setItem = (i, k, v) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem = () => setItems((prev) => [...prev, { name: '', qty: '100', unit: 'g', kcal: 0, proteine: 0, carboidrati: 0, kcal_source: 'cary' }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    const valid = items.filter((it) => it.name && (it.name + '').trim());
    if (!valid.length) {
      toast({ title: t('common.error'), description: t('import.food_no_items'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        entry_date: date || todayStr(),
        meal_type: mealType,
        items: valid.map((it) => ({
          name: String(it.name).slice(0, 80),
          qty: String(it.qty || ''),
          unit: it.unit || 'g',
          kcal: Math.max(0, Math.round(Number(it.kcal) || 0)),
          proteine: Math.max(0, Math.round(Number(it.proteine) * 10) / 10),
          carboidrati: Math.max(0, Math.round(Number(it.carboidrati) * 10) / 10),
          kcal_source: it.kcal_source || 'cary',
        })),
        reaction: 'nessuna',
        tolerated: true,
      };
      await base44.entities.FoodEntry.create(payload);

      // Per admin: aggiunge l'alimento al catalogo condiviso (solo etichetta).
      if (toCatalog && isAdmin && category === 'etichetta' && extracted) {
        try {
          await base44.entities.FoodCatalogItem.create({
            category: 'Importati',
            name: extracted.name,
            default_unit: extracted.default_unit || 'g',
            kcal: extracted.kcal || 0,
            proteine: extracted.proteine || 0,
            carboidrati: extracted.carboidrati || 0,
            portion_grams: extracted.portion_grams || undefined,
          });
        } catch { /* ignore catalog errors */ }
      }

      onSaved && onSaved(category === 'etichetta' ? t('import.food_label_saved') : t('import.meal_saved'));
    } catch (err) {
      toast({ title: t('common.error'), description: String(err && err.message || err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <p className="font-semibold">{category === 'etichetta' ? t('import.review_label') : t('import.review_meal')}</p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">{t('common.date')}</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} className="rounded-xl mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t('food.meal_type')}</label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger className="mt-1 rounded-xl bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>{MEALS.map((m) => <SelectItem key={m} value={m}>{t('meal.' + m)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t('import.items')}</p>
            <button onClick={addItem} className="inline-flex items-center gap-1 text-xs text-primary font-medium"><Plus className="w-3.5 h-3.5" /> {t('import.add_item')}</button>
          </div>
          {items.map((it, i) => (
            <div key={i} className="rounded-xl border border-input bg-background p-2.5 space-y-2">
              <div className="flex items-center gap-2">
                <input value={it.name} onChange={(e) => setItem(i, 'name', e.target.value)} placeholder={t('exams.marker_name')} className={inputCls + ' flex-1'} />
                <button onClick={() => removeItem(i)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 shrink-0" aria-label={t('common.delete')}><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <input value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} placeholder="qty" className={inputCls} />
                <Select value={it.unit || 'g'} onValueChange={(v) => setItem(i, 'unit', v)}>
                  <SelectTrigger className="bg-background text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
                <input value={it.kcal || ''} onChange={(e) => setItem(i, 'kcal', e.target.value)} placeholder="kcal" inputMode="decimal" className={inputCls} />
                <input value={it.proteine || ''} onChange={(e) => setItem(i, 'proteine', e.target.value)} placeholder="prot" inputMode="decimal" className={inputCls} />
              </div>
              {category === 'piatto' && (
                <p className="text-[11px] text-amber-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {t('import.estimated_values')}</p>
              )}
            </div>
          ))}
        </div>

        {isAdmin && category === 'etichetta' && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={toCatalog} onChange={(e) => setToCatalog(e.target.checked)} className="w-4 h-4 rounded" />
            <span>{t('import.add_to_catalog')}</span>
          </label>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={save} disabled={saving} className="rounded-xl flex-1">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
            {t('common.save')}
          </Button>
          <Button variant="outline" onClick={onCancel} className="rounded-xl">{t('common.cancel')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}