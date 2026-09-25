import React, { useMemo, useState } from 'react';
import { Search, X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { computeItemNutrition, buildCatalogMap } from '@/lib/nutrition';
import { useI18n } from '@/lib/i18n';
import UnitSelect from '@/components/UnitSelect';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Checklist "Rivista mediterranea": ricerca in alto, sezioni per categoria con
// header serif, righe alimento con checkbox a sinistra e — se spuntate —
// input quantità + select unità + badge kcal/prot a destra. Gli items
// selezionati ma non presenti nel catalogo (da pasti legacy o modelli)
// finiscono nel gruppo "Altro" con campi manuali per kcal/proteine e un
// pulsante "Stima con Cary".
//
// Props:
//   groups  array di { category, items: [{name, default_unit, kcal, proteine}] }
//   value   array di {name, qty, unit, kcal?, proteine?, kcal_source?} selezionati
//   onChange(newValue)
export default function FoodChecklist({ groups, value = [], onChange }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  const catalogMap = useMemo(() => buildCatalogMap(groups), [groups]);

  const selectedMap = useMemo(() => {
    const m = new Map();
    value.forEach((it) => m.set(it.name, it));
    return m;
  }, [value]);

  const setItem = (name, patch) => {
    const exists = selectedMap.get(name);
    if (exists) {
      onChange(value.map((it) => (it.name === name ? { ...it, ...patch } : it)));
    } else {
      onChange([...value, { name, qty: '', unit: 'porzione', ...patch }]);
    }
  };

  const toggle = (name, checked, defaultUnit, catalogEntry) => {
    if (checked) {
      onChange(value.filter((it) => it.name !== name));
    } else {
      const item = { name, qty: '', unit: defaultUnit || 'porzione' };
      const n = computeItemNutrition(item, catalogEntry);
      onChange([...value, { ...item, kcal: n.kcal, proteine: n.proteine, kcal_source: 'catalog' }]);
    }
  };

  const removeExtra = (name) => onChange(value.filter((it) => it.name !== name));

  const catalogNames = useMemo(() => {
    const s = new Set();
    groups.forEach((g) => g.items.forEach((it) => s.add(it.name)));
    return s;
  }, [groups]);

  const q = query.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({
      ...g,
      items: q
        ? g.items.filter((it) => it.name.toLowerCase().includes(q))
        : g.items,
    }))
    .filter((g) => g.items.length > 0);

  const extras = value.filter((it) => !catalogNames.has(it.name));
  const showExtras = extras.length > 0 && !q;

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        {t('food.no_catalog')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('food.search')}
          className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="max-h-[44vh] overflow-y-auto -mx-1 px-1 space-y-4">
        {showExtras && (
          <Group title={t('food.other')} tone="accent">
            {extras.map((it) => (
              <ExtraRow
                key={it.name}
                it={it}
                onQty={(v) => setItem(it.name, { qty: v })}
                onUnit={(v) => setItem(it.name, { unit: v })}
                onNutrition={(kcal, proteine, source) => setItem(it.name, { kcal, proteine, kcal_source: source })}
                onDelete={() => removeExtra(it.name)}
              />
            ))}
          </Group>
        )}

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground italic px-1">{t('food.no_match')}</p>
        ) : (
          filtered.map((g) => (
            <Group key={g.category} title={g.category}>
              {g.items.map((it) => {
                const sel = selectedMap.get(it.name);
                const checked = !!sel;
                return (
                  <Row
                    key={it.name}
                    checked={checked}
                    name={it.name}
                    qty={sel?.qty}
                    unit={sel?.unit || it.default_unit}
                    kcal={sel?.kcal}
                    proteine={sel?.proteine}
                    onToggle={() => toggle(it.name, checked, it.default_unit, it)}
                    onQty={(v) => {
                      const n = computeItemNutrition({ name: it.name, qty: v, unit: sel?.unit || it.default_unit }, it);
                      setItem(it.name, { qty: v, kcal: n.kcal, proteine: n.proteine, kcal_source: 'catalog' });
                    }}
                    onUnit={(v) => {
                      const n = computeItemNutrition({ name: it.name, qty: sel?.qty, unit: v }, it);
                      setItem(it.name, { unit: v, kcal: n.kcal, proteine: n.proteine, kcal_source: 'catalog' });
                    }}
                  />
                );
              })}
            </Group>
          ))
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{value.length}</span> {t('food.selected_count')}
      </p>
    </div>
  );
}

function Group({ title, tone, children }) {
  return (
    <div>
      <p
        className={cn(
          'sticky top-0 z-10 bg-background/95 backdrop-blur px-2 py-1.5 mb-1 font-heading text-sm font-semibold tracking-wide rounded-md',
          tone === 'accent' ? 'text-terracotta' : 'text-primary'
        )}
      >
        {title}
      </p>
      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border bg-card">
        {children}
      </div>
    </div>
  );
}

function NutritionBadge({ kcal, proteine }) {
  const { t } = useI18n();
  return (
    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
      <span className="text-terracotta font-medium">{kcal || 0}</span>
      <span>{t('food.kcal_unit')}</span>
      <span className="text-muted-foreground/40">·</span>
      <span className="text-primary font-medium">{proteine || 0}</span>
      <span>{t('food.prot_unit')}</span>
    </span>
  );
}

function Row({ checked, name, qty, unit, kcal, proteine, onToggle, onQty, onUnit }) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 transition-colors',
        checked ? 'bg-terracotta/10' : 'bg-card'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className={cn(
          'shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors',
          checked
            ? 'bg-terracotta border-terracotta text-terracotta-foreground'
            : 'border-border hover:border-terracotta/60'
        )}
      >
        {checked && <X className="w-3.5 h-3.5" strokeWidth={3} />}
        {!checked && <Plus className="w-3.5 h-3.5 opacity-0" />}
      </button>

      <span
        className={cn(
          'flex-1 text-sm leading-tight truncate',
          checked ? 'font-medium text-foreground' : 'text-foreground/90'
        )}
      >
        {name}
      </span>

      {checked && (
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            inputMode="decimal"
            value={qty || ''}
            onChange={(e) => onQty(e.target.value)}
            placeholder="0"
            className="w-14 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <UnitSelect value={unit || 'porzione'} onChange={onUnit} />
          <NutritionBadge kcal={kcal} proteine={proteine} />
        </div>
      )}
    </div>
  );
}

// Riga "Altro": cibo non in catalogo. Oltre a qty/unità, mostra due piccoli
// input per kcal e proteine totali dell'item e un pulsante "Stima con Cary"
// che richiama la funzione estimateFoodNutrition per compilare i valori.
function ExtraRow({ it, onQty, onUnit, onNutrition, onDelete }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [estimating, setEstimating] = useState(false);

  const estimate = async () => {
    setEstimating(true);
    try {
      const res = await base44.functions.invoke('estimateFoodNutrition', { name: it.name });
      const data = res && res.data ? res.data : res;
      if (data && (data.error || !data.kcal)) {
        throw new Error(data.error || 'Nessun valore');
      }
      onNutrition(Number(data.kcal) || 0, Number(data.proteine) || 0, 'cary');
      if (data.note) {
        toast({ title: t('food.cary_estimate_done'), description: data.note });
      }
    } catch (e) {
      toast({ title: t('food.cary_estimate_error'), variant: 'destructive' });
    } finally {
      setEstimating(false);
    }
  };

  return (
    <div className="bg-terracotta/10 px-2.5 py-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDelete}
          aria-pressed={false}
          className="shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center bg-terracotta border-terracotta text-terracotta-foreground"
        >
          <X className="w-3.5 h-3.5" strokeWidth={3} />
        </button>
        <span className="flex-1 text-sm font-medium text-foreground truncate">{it.name}</span>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
          aria-label={t('food.aria_remove')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 pl-8">
        <input
          type="number"
          inputMode="decimal"
          value={it.qty || ''}
          onChange={(e) => onQty(e.target.value)}
          placeholder="0"
          className="w-14 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <UnitSelect value={it.unit || 'porzione'} onChange={onUnit} />
        <input
          type="number"
          inputMode="decimal"
          value={it.kcal ?? ''}
          onChange={(e) => onNutrition(Number(e.target.value) || 0, Number(it.proteine) || 0, 'manual')}
          placeholder={t('food.kcal_unit')}
          className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label={t('food.kcal_unit')}
        />
        <input
          type="number"
          inputMode="decimal"
          value={it.proteine ?? ''}
          onChange={(e) => onNutrition(Number(it.kcal) || 0, Number(e.target.value) || 0, 'manual')}
          placeholder={t('food.prot_unit')}
          className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label={t('food.prot_unit')}
        />
        <button
          type="button"
          onClick={estimate}
          disabled={estimating}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-terracotta/40 bg-terracotta/10 px-2 py-1 text-xs text-terracotta hover:bg-terracotta/20 disabled:opacity-50"
          title={t('food.cary_estimate')}
        >
          {estimating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{estimating ? t('food.cary_estimating') : t('food.cary_estimate')}</span>
        </button>
      </div>
    </div>
  );
}