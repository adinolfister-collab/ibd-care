// Catalogo condiviso degli alimenti + helper per la checklist dosi.
//
// - UNIT_UNITS: unità di dose selezionabili per ogni alimento spuntato.
// - DEFAULT_CATALOG: copia statica usata come fallback per gli ospiti (non
//   autenticati, quindi senza accesso al DB) e quando il catalogo gestito
//   dall'admin è vuoto/non ancora caricato.
// - serializeItems: compone il riepilogo testuale (campo `foods`) a partire
//   dagli items strutturati, così i componenti che leggono `foods` testo
//   (MealSymptomCorrelation, MealSpikes, Trends, Summary/Assistant) continuano
//   a funzionare senza modifiche.
// - parseLegacyFoods: converte il testo libero dei pasti vecchi o dei modelli
//   in items spuntabili (categoria "Altro"), così restano modificabili.

export const UNITS = [
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
  { value: 'porzione', label: 'porzione' },
  { value: 'cucchiaio', label: 'cucchiaio' },
  { value: 'tazza', label: 'tazza' },
  { value: 'fetta', label: 'fetta' },
];

export const UNIT_LABELS = UNITS.reduce((acc, u) => { acc[u.value] = u.label; return acc; }, {});

export const DEFAULT_CATALOG = [
  // Cereali e granaglie
  { category: 'Cereali e granaglie', name: 'Riso', default_unit: 'g' },
  { category: 'Cereali e granaglie', name: 'Pasta', default_unit: 'g' },
  { category: 'Cereali e granaglie', name: 'Pane', default_unit: 'fetta' },
  { category: 'Cereali e granaglie', name: 'Crackers', default_unit: 'porzione' },
  { category: 'Cereali e granaglie', name: 'Fiocchi d’avena', default_unit: 'g' },
  { category: 'Cereali e granaglie', name: 'Mais', default_unit: 'porzione' },
  { category: 'Cereali e granaglie', name: 'Quinoa', default_unit: 'g' },
  { category: 'Cereali e granaglie', name: 'Patate', default_unit: 'g' },
  // Proteine
  { category: 'Proteine', name: 'Pollo', default_unit: 'g' },
  { category: 'Proteine', name: 'Tacchino', default_unit: 'g' },
  { category: 'Proteine', name: 'Pesce bianco', default_unit: 'g' },
  { category: 'Proteine', name: 'Salmone', default_unit: 'g' },
  { category: 'Proteine', name: 'Uova', default_unit: 'porzione' },
  { category: 'Proteine', name: 'Tofu', default_unit: 'g' },
  { category: 'Proteine', name: 'Legumi', default_unit: 'porzione' },
  { category: 'Proteine', name: 'Carne magra', default_unit: 'g' },
  // Verdure
  { category: 'Verdure', name: 'Zucchine', default_unit: 'g' },
  { category: 'Verdure', name: 'Carote', default_unit: 'g' },
  { category: 'Verdure', name: 'Pomodoro', default_unit: 'porzione' },
  { category: 'Verdure', name: 'Spinaci', default_unit: 'g' },
  { category: 'Verdure', name: 'Finocchio', default_unit: 'porzione' },
  { category: 'Verdure', name: 'Melanzane', default_unit: 'g' },
  { category: 'Verdure', name: 'Peperoni', default_unit: 'g' },
  { category: 'Verdure', name: 'Insalata', default_unit: 'porzione' },
  // Frutta
  { category: 'Frutta', name: 'Mela', default_unit: 'porzione' },
  { category: 'Frutta', name: 'Pera', default_unit: 'porzione' },
  { category: 'Frutta', name: 'Banana', default_unit: 'porzione' },
  { category: 'Frutta', name: 'Frutti rossi', default_unit: 'g' },
  { category: 'Frutta', name: 'Kiwi', default_unit: 'porzione' },
  { category: 'Frutta', name: 'Agrumi', default_unit: 'porzione' },
  // Latticini e alternative
  { category: 'Latticini e alternative', name: 'Yogurt bianco', default_unit: 'g' },
  { category: 'Latticini e alternative', name: 'Mozzarella light', default_unit: 'g' },
  { category: 'Latticini e alternative', name: 'Parmigiano', default_unit: 'g' },
  { category: 'Latticini e alternative', name: 'Latte senza lattosio', default_unit: 'ml' },
  { category: 'Latticini e alternative', name: 'Ricotta', default_unit: 'g' },
  // Condimenti
  { category: 'Condimenti', name: 'Olio EVO', default_unit: 'cucchiaio' },
  { category: 'Condimenti', name: 'Burro', default_unit: 'g' },
  { category: 'Condimenti', name: 'Olive', default_unit: 'porzione' },
  { category: 'Condimenti', name: 'Salsa di soia', default_unit: 'cucchiaio' },
  { category: 'Condimenti', name: 'Miele', default_unit: 'cucchiaio' },
];

// Trasforma una lista piatta di voci del catalogo (dal DB o dal fallback)
// in gruppi ordinati per categoria, con la mappa nome -> unità di default.
export function catalogToGroups(catalog) {
  const list = (catalog && catalog.length ? catalog : DEFAULT_CATALOG);
  const map = new Map();
  list.forEach((c) => {
    const cat = c.category || 'Altro';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(c);
  });
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    items: items
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)),
  }));
}

// Riepilogo testuale degli items per il campo `foods` (compatibilità).
export function serializeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return '';
  return items
    .map((it) => {
      const name = (it.name || '').trim();
      if (!name) return '';
      const qty = (it.qty || '').toString().trim();
      const unit = it.unit && it.unit !== 'porzione' ? it.unit : '';
      if (qty && unit) return `${name} ${qty} ${unit}`;
      if (qty) return `${name} ${qty}`;
      if (unit) return `${name} (${unit})`;
      return name;
    })
    .filter(Boolean)
    .join('; ');
}

// Converte testo libero (pasta vecchia o modelli) in items spuntabili
// minimi, da mostrare come righe "Altro".
export function parseLegacyFoods(text) {
  return String(text || '')
    .split(/[\n,;·•]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((name) => ({ name, qty: '', unit: 'porzione' }));
}

// Verifica se un pasto vale come "legacy" (solo testo, niente items).
export function isLegacyMeal(entry) {
  return Array.isArray(entry?.items) ? entry.items.length === 0 && !!entry.foods : !!entry?.foods;
}