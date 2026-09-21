// Catalogo condiviso degli alimenti + helper per la checklist dosi.
//
// - UNITS: unità di dose selezionabili per ogni alimento spuntato.
// - DEFAULT_CATALOG: catalogo statico strutturato per sottocategorie IBD,
//   usato come fallback per gli ospiti e quando il catalogo admin è vuoto.
// - serializeItems / parseLegacyFoods / catalogToGroups: helper di compatibilità.

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
  // Verdure cotte (generalmente ben tollerate)
  { category: 'Verdure cotte', name: 'Zucchine', default_unit: 'g' },
  { category: 'Verdure cotte', name: 'Carote', default_unit: 'g' },
  { category: 'Verdure cotte', name: 'Zucca', default_unit: 'g' },
  { category: 'Verdure cotte', name: 'Patate lesse', default_unit: 'g' },
  { category: 'Verdure cotte', name: 'Spinaci cotti', default_unit: 'g' },
  { category: 'Verdure cotte', name: 'Melanzane cotte', default_unit: 'g' },
  { category: 'Verdure cotte', name: 'Finocchio cotto', default_unit: 'porzione' },
  { category: 'Verdure cotte', name: 'Zuppa di verdure', default_unit: 'porzione' },

  // Verdure crude (potenzialmente irritanti)
  { category: 'Verdure crude', name: 'Insalata verde', default_unit: 'porzione' },
  { category: 'Verdure crude', name: 'Pomodoro crudo', default_unit: 'porzione' },
  { category: 'Verdure crude', name: 'Cavolo crudo', default_unit: 'g' },
  { category: 'Verdure crude', name: 'Broccoli crudi', default_unit: 'g' },
  { category: 'Verdure crude', name: 'Cavolfiore crudo', default_unit: 'g' },
  { category: 'Verdure crude', name: 'Finocchio crudo', default_unit: 'porzione' },
  { category: 'Verdure crude', name: 'Sedano', default_unit: 'g' },
  { category: 'Verdure crude', name: 'Cipolla cruda', default_unit: 'porzione' },

  // Frutta
  { category: 'Frutta', name: 'Banana', default_unit: 'porzione' },
  { category: 'Frutta', name: 'Mela sbucciata', default_unit: 'porzione' },
  { category: 'Frutta', name: 'Pera sbucciata', default_unit: 'porzione' },
  { category: 'Frutta', name: 'Kiwi', default_unit: 'porzione' },
  { category: 'Frutta', name: 'Frutti rossi', default_unit: 'g' },
  { category: 'Frutta', name: 'Agrumi', default_unit: 'porzione' },
  { category: 'Frutta', name: 'Frutta secca', default_unit: 'g' },
  { category: 'Frutta', name: 'Avocado', default_unit: 'porzione' },

  // Latticini
  { category: 'Latticini', name: 'Yogurt bianco', default_unit: 'g' },
  { category: 'Latticini', name: 'Latte senza lattosio', default_unit: 'ml' },
  { category: 'Latticini', name: 'Mozzarella light', default_unit: 'g' },
  { category: 'Latticini', name: 'Parmigiano', default_unit: 'g' },
  { category: 'Latticini', name: 'Ricotta', default_unit: 'g' },
  { category: 'Latticini', name: 'Gelato', default_unit: 'porzione' },

  // Carni magre
  { category: 'Carni magre', name: 'Pollo', default_unit: 'g' },
  { category: 'Carni magre', name: 'Tacchino', default_unit: 'g' },
  { category: 'Carni magre', name: 'Pesce bianco', default_unit: 'g' },
  { category: 'Carni magre', name: 'Salmone', default_unit: 'g' },
  { category: 'Carni magre', name: 'Uova', default_unit: 'porzione' },
  { category: 'Carni magre', name: 'Tofu', default_unit: 'g' },
  { category: 'Carni magre', name: 'Carne rossa magra', default_unit: 'g' },

  // Legumi
  { category: 'Legumi', name: 'Lenticchie', default_unit: 'porzione' },
  { category: 'Legumi', name: 'Ceci', default_unit: 'porzione' },
  { category: 'Legumi', name: 'Fagioli', default_unit: 'porzione' },
  { category: 'Legumi', name: 'Piselli', default_unit: 'porzione' },
  { category: 'Legumi', name: 'Fave', default_unit: 'porzione' },

  // Cereali integrali
  { category: 'Cereali integrali', name: 'Riso integrale', default_unit: 'g' },
  { category: 'Cereali integrali', name: 'Quinoa', default_unit: 'g' },
  { category: 'Cereali integrali', name: "Fiocchi d'avena", default_unit: 'g' },
  { category: 'Cereali integrali', name: 'Pane integrale', default_unit: 'fetta' },
  { category: 'Cereali integrali', name: 'Pasta integrale', default_unit: 'g' },

  // Cereali raffinati
  { category: 'Cereali raffinati', name: 'Riso bianco', default_unit: 'g' },
  { category: 'Cereali raffinati', name: 'Pasta bianca', default_unit: 'g' },
  { category: 'Cereali raffinati', name: 'Pane bianco', default_unit: 'fetta' },
  { category: 'Cereali raffinati', name: 'Crackers', default_unit: 'porzione' },
  { category: 'Cereali raffinati', name: 'Patate', default_unit: 'g' },
  { category: 'Cereali raffinati', name: 'Mais', default_unit: 'porzione' },

  // Bevande
  { category: 'Bevande', name: 'Acqua', default_unit: 'ml' },
  { category: 'Bevande', name: 'Tè verde', default_unit: 'tazza' },
  { category: 'Bevande', name: 'Caffè', default_unit: 'tazza' },
  { category: 'Bevande', name: 'Succhi di frutta', default_unit: 'ml' },
  { category: 'Bevande', name: 'Birra', default_unit: 'porzione' },
  { category: 'Bevande', name: 'Vino', default_unit: 'porzione' },

  // Dolcificanti e condimenti
  { category: 'Dolcificanti', name: 'Olio EVO', default_unit: 'cucchiaio' },
  { category: 'Dolcificanti', name: 'Miele', default_unit: 'cucchiaio' },
  { category: 'Dolcificanti', name: 'Zucchero', default_unit: 'cucchiaio' },
  { category: 'Dolcificanti', name: 'Burro', default_unit: 'g' },
  { category: 'Dolcificanti', name: 'Olive', default_unit: 'porzione' },
  { category: 'Dolcificanti', name: 'Salsa di soia', default_unit: 'cucchiaio' },
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