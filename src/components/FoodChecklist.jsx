import React, { useMemo, useState } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { UNITS } from '@/lib/foodCatalog';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Checklist "Rivista mediterranea": ricerca in alto, sezioni per categoria con
// header serif, righe alimento con checkbox a sinistra e — se spuntate —
// input quantità + select unità a destra. Gli items selezionati ma non
// presenti nel catalogo (da pasti legacy o modelli) finiscono nel gruppo
// "Altro" con icona di rimozione.
//
// Props:
//   groups  array di { category, items: [{name, default_unit}] } (catalogToGroups)
//   value   array di {name, qty, unit} selezionati
//   onChange(newValue)
export default function FoodChecklist({ groups, value = [], onChange }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  // mappa nome -> voce selezionata (per lookup veloce)
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
      onChange([...value, { name, qty: '', unit: patch.unit || 'porzione', ...patch }]);
    }
  };

  const toggle = (name, checked, defaultUnit) => {
    if (checked) {
      onChange(value.filter((it) => it.name !== name));
    } else {
      onChange([...value, { name, qty: '', unit: defaultUnit || 'porzione' }]);
    }
  };

  const removeExtra = (name) => onChange(value.filter((it) => it.name !== name));

  // nomi del catalogo (per distinguere gli "extra")
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

  // voci extra: selezionate ma non nel catalogo
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
              <Row
                key={it.name}
                checked
                name={it.name}
                qty={it.qty}
                unit={it.unit}
                onToggle={() => removeExtra(it.name)}
                onQty={(v) => setItem(it.name, { qty: v })}
                onUnit={(v) => setItem(it.name, { unit: v })}
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
                    onToggle={() => toggle(it.name, checked, it.default_unit)}
                    onQty={(v) => setItem(it.name, { qty: v })}
                    onUnit={(v) => setItem(it.name, { unit: v })}
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

function Row({ checked, name, qty, unit, onToggle, onQty, onUnit, onDelete }) {
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
          'flex-1 text-sm leading-tight',
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
          <select
            value={unit || 'porzione'}
            onChange={(e) => onUnit(e.target.value)}
            className="rounded-lg border border-input bg-background px-1.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
              aria-label="Rimuovi"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}