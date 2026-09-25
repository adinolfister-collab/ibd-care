// Catalogo condiviso degli alimenti + helper per la checklist dosi.
//
// - UNITS: unità di dose selezionabili per ogni alimento spuntato.
// - DEFAULT_CATALOG: catalogo statico strutturato per sottocategorie IBD,
//   usato come fallback per gli ospiti e quando il catalogo admin è vuoto.
//   Ogni voce include kcal e proteine per 100 g (o 100 ml).
// - serializeItems / parseLegacyFoods / catalogToGroups: helper di compatibilità.

// Le etichette delle unità sono tradotte via i18n (vedi src/lib/enumLabels.js,
// UNIT_KEYS). Qui restano solo i valori enum.
export const UNITS = [
  { value: 'g' },
  { value: 'ml' },
  { value: 'porzione' },
  { value: 'cucchiaio' },
  { value: 'tazza' },
  { value: 'fetta' },
];

// Valori nutrizionali per 100 g (o 100 ml), intesi come alimento COTTO/pronto.
export const DEFAULT_CATALOG = [
  // Verdure cotte (generalmente ben tollerate)
  { category: 'Verdure cotte', name: 'Zucchine', default_unit: 'g', kcal: 17, proteine: 1.2 },
  { category: 'Verdure cotte', name: 'Carote', default_unit: 'g', kcal: 41, proteine: 0.9 },
  { category: 'Verdure cotte', name: 'Zucca', default_unit: 'g', kcal: 26, proteine: 1.0 },
  { category: 'Verdure cotte', name: 'Patate lesse', default_unit: 'g', kcal: 87, proteine: 2.0 },
  { category: 'Verdure cotte', name: 'Spinaci cotti', default_unit: 'g', kcal: 23, proteine: 3.0 },
  { category: 'Verdure cotte', name: 'Melanzane cotte', default_unit: 'g', kcal: 25, proteine: 1.0 },
  { category: 'Verdure cotte', name: 'Finocchio cotto', default_unit: 'porzione', kcal: 31, proteine: 1.2 },
  { category: 'Verdure cotte', name: 'Zuppa di verdure', default_unit: 'porzione', kcal: 40, proteine: 1.5 },
  { category: 'Verdure cotte', name: 'Funghi champignon', default_unit: 'g', kcal: 22, proteine: 3.1 },
  { category: 'Verdure cotte', name: 'Asparagi cotti', default_unit: 'g', kcal: 20, proteine: 2.2 },
  { category: 'Verdure cotte', name: 'Bietole cotte', default_unit: 'g', kcal: 19, proteine: 1.8 },
  { category: 'Verdure cotte', name: 'Porri cotti', default_unit: 'g', kcal: 61, proteine: 1.5 },

  // Verdure crude (potenzialmente irritanti)
  { category: 'Verdure crude', name: 'Insalata verde', default_unit: 'porzione', kcal: 15, proteine: 1.4 },
  { category: 'Verdure crude', name: 'Pomodoro crudo', default_unit: 'porzione', kcal: 18, proteine: 0.9 },
  { category: 'Verdure crude', name: 'Cavolo crudo', default_unit: 'g', kcal: 28, proteine: 1.4 },
  { category: 'Verdure crude', name: 'Broccoli crudi', default_unit: 'g', kcal: 34, proteine: 2.8 },
  { category: 'Verdure crude', name: 'Cavolfiore crudo', default_unit: 'g', kcal: 25, proteine: 1.9 },
  { category: 'Verdure crude', name: 'Finocchio crudo', default_unit: 'porzione', kcal: 31, proteine: 1.2 },
  { category: 'Verdure crude', name: 'Sedano', default_unit: 'g', kcal: 16, proteine: 0.7 },
  { category: 'Verdure crude', name: 'Cipolla cruda', default_unit: 'porzione', kcal: 40, proteine: 1.1 },
  { category: 'Verdure crude', name: 'Radicchio', default_unit: 'porzione', kcal: 23, proteine: 1.4 },
  { category: 'Verdure crude', name: 'Cicoria', default_unit: 'porzione', kcal: 23, proteine: 0.9 },

  // Frutta
  { category: 'Frutta', name: 'Banana', default_unit: 'porzione', kcal: 89, proteine: 1.1 },
  { category: 'Frutta', name: 'Mela sbucciata', default_unit: 'porzione', kcal: 52, proteine: 0.3 },
  { category: 'Frutta', name: 'Pera sbucciata', default_unit: 'porzione', kcal: 57, proteine: 0.4 },
  { category: 'Frutta', name: 'Kiwi', default_unit: 'porzione', kcal: 61, proteine: 1.1 },
  { category: 'Frutta', name: 'Frutti rossi', default_unit: 'g', kcal: 57, proteine: 0.7 },
  { category: 'Frutta', name: 'Agrumi', default_unit: 'porzione', kcal: 47, proteine: 0.9 },
  { category: 'Frutta', name: 'Frutta secca', default_unit: 'g', kcal: 607, proteine: 20 },
  { category: 'Frutta', name: 'Avocado', default_unit: 'porzione', kcal: 160, proteine: 2.0 },
  { category: 'Frutta', name: 'Ananas', default_unit: 'porzione', kcal: 50, proteine: 0.5 },
  { category: 'Frutta', name: 'Cocomero', default_unit: 'porzione', kcal: 30, proteine: 0.6 },
  { category: 'Frutta', name: 'Pesca', default_unit: 'porzione', kcal: 39, proteine: 0.9 },
  { category: 'Frutta', name: 'Mandarino', default_unit: 'porzione', kcal: 53, proteine: 0.8 },
  { category: 'Frutta', name: 'Uva', default_unit: 'porzione', kcal: 67, proteine: 0.6 },
  { category: 'Frutta', name: 'Melone', default_unit: 'porzione', kcal: 34, proteine: 0.8 },
  { category: 'Frutta', name: 'Mirtilli', default_unit: 'g', kcal: 57, proteine: 0.6 },
  { category: 'Frutta', name: 'Frullato di frutta', default_unit: 'ml', kcal: 50, proteine: 0.5 },

  // Latticini
  { category: 'Latticini', name: 'Yogurt bianco', default_unit: 'g', kcal: 61, proteine: 3.5 },
  { category: 'Latticini', name: 'Yogurt greco', default_unit: 'g', kcal: 59, proteine: 10 },
  { category: 'Latticini', name: 'Latte senza lattosio', default_unit: 'ml', kcal: 42, proteine: 3.4 },
  { category: 'Latticini', name: 'Mozzarella light', default_unit: 'g', kcal: 170, proteine: 18 },
  { category: 'Latticini', name: 'Parmigiano', default_unit: 'g', kcal: 392, proteine: 36 },
  { category: 'Latticini', name: 'Ricotta', default_unit: 'g', kcal: 174, proteine: 11 },
  { category: 'Latticini', name: 'Gelato', default_unit: 'porzione', kcal: 207, proteine: 3.5 },
  { category: 'Latticini', name: 'Fiocchi di latte', default_unit: 'g', kcal: 98, proteine: 12 },
  { category: 'Latticini', name: 'Stracchino', default_unit: 'g', kcal: 300, proteine: 18 },
  { category: 'Latticini', name: 'Gorgonzola', default_unit: 'g', kcal: 350, proteine: 19 },
  { category: 'Latticini', name: 'Fontina', default_unit: 'g', kcal: 323, proteine: 25 },
  { category: 'Latticini', name: 'Formaggio spalmabile light', default_unit: 'g', kcal: 120, proteine: 8 },

  // Carni magre
  { category: 'Carni magre', name: 'Pollo', default_unit: 'g', kcal: 165, proteine: 31 },
  { category: 'Carni magre', name: 'Tacchino', default_unit: 'g', kcal: 135, proteine: 30 },
  { category: 'Carni magre', name: 'Pesce bianco', default_unit: 'g', kcal: 90, proteine: 20 },
  { category: 'Carni magre', name: 'Salmone', default_unit: 'g', kcal: 208, proteine: 20 },
  { category: 'Carni magre', name: 'Uova', default_unit: 'porzione', kcal: 155, proteine: 13 },
  { category: 'Carni magre', name: 'Tofu', default_unit: 'g', kcal: 76, proteine: 8 },
  { category: 'Carni magre', name: 'Carne rossa magra', default_unit: 'g', kcal: 250, proteine: 26 },
  { category: 'Carni magre', name: 'Prosciutto cotto', default_unit: 'g', kcal: 150, proteine: 22 },
  { category: 'Carni magre', name: 'Prosciutto crudo', default_unit: 'g', kcal: 195, proteine: 26 },
  { category: 'Carni magre', name: 'Bresaola', default_unit: 'g', kcal: 220, proteine: 32 },
  { category: 'Carni magre', name: 'Tonno al naturale', default_unit: 'g', kcal: 116, proteine: 26 },
  { category: 'Carni magre', name: 'Sgombro', default_unit: 'g', kcal: 205, proteine: 20 },
  { category: 'Carni magre', name: 'Trota', default_unit: 'g', kcal: 168, proteine: 20 },
  { category: 'Carni magre', name: 'Seitan', default_unit: 'g', kcal: 121, proteine: 24 },
  { category: 'Carni magre', name: 'Tempeh', default_unit: 'g', kcal: 192, proteine: 19 },

  // Legumi
  { category: 'Legumi', name: 'Lenticchie', default_unit: 'porzione', kcal: 116, proteine: 9 },
  { category: 'Legumi', name: 'Ceci', default_unit: 'porzione', kcal: 164, proteine: 8.9 },
  { category: 'Legumi', name: 'Fagioli', default_unit: 'porzione', kcal: 127, proteine: 9 },
  { category: 'Legumi', name: 'Piselli', default_unit: 'porzione', kcal: 81, proteine: 5.4 },
  { category: 'Legumi', name: 'Fave', default_unit: 'porzione', kcal: 110, proteine: 7.6 },
  { category: 'Legumi', name: 'Humus', default_unit: 'porzione', kcal: 166, proteine: 8 },

  // Cereali integrali
  { category: 'Cereali integrali', name: 'Riso integrale', default_unit: 'g', kcal: 123, proteine: 2.7 },
  { category: 'Cereali integrali', name: 'Quinoa', default_unit: 'g', kcal: 120, proteine: 4.4 },
  { category: 'Cereali integrali', name: "Fiocchi d'avena", default_unit: 'g', kcal: 389, proteine: 13 },
  { category: 'Cereali integrali', name: 'Pane integrale', default_unit: 'fetta', kcal: 247, proteine: 13 },
  { category: 'Cereali integrali', name: 'Pasta integrale', default_unit: 'g', kcal: 158, proteine: 5.8 },
  { category: 'Cereali integrali', name: 'Grano saraceno', default_unit: 'g', kcal: 92, proteine: 3.4 },
  { category: 'Cereali integrali', name: 'Miglio', default_unit: 'g', kcal: 119, proteine: 3.5 },
  { category: 'Cereali integrali', name: 'Cous cous', default_unit: 'g', kcal: 112, proteine: 3.8 },
  { category: 'Cereali integrali', name: 'Pane di segale', default_unit: 'fetta', kcal: 259, proteine: 8 },

  // Cereali raffinati
  { category: 'Cereali raffinati', name: 'Riso bianco', default_unit: 'g', kcal: 130, proteine: 2.7 },
  { category: 'Cereali raffinati', name: 'Pasta bianca', default_unit: 'g', kcal: 158, proteine: 6 },
  { category: 'Cereali raffinati', name: 'Pane bianco', default_unit: 'fetta', kcal: 265, proteine: 9 },
  { category: 'Cereali raffinati', name: 'Crackers', default_unit: 'porzione', kcal: 380, proteine: 10 },
  { category: 'Cereali raffinati', name: 'Patate', default_unit: 'g', kcal: 77, proteine: 2 },
  { category: 'Cereali raffinati', name: 'Mais', default_unit: 'porzione', kcal: 96, proteine: 3.4 },
  { category: 'Cereali raffinati', name: 'Fette biscottate', default_unit: 'porzione', kcal: 390, proteine: 9 },
  { category: 'Cereali raffinati', name: 'Corn flakes', default_unit: 'porzione', kcal: 357, proteine: 7 },
  { category: 'Cereali raffinati', name: 'Gallette di riso', default_unit: 'porzione', kcal: 380, proteine: 8 },

  // Bevande
  { category: 'Bevande', name: 'Acqua', default_unit: 'ml', kcal: 0, proteine: 0 },
  { category: 'Bevande', name: 'Tè verde', default_unit: 'tazza', kcal: 1, proteine: 0 },
  { category: 'Bevande', name: 'Caffè', default_unit: 'tazza', kcal: 2, proteine: 0.3 },
  { category: 'Bevande', name: 'Succhi di frutta', default_unit: 'ml', kcal: 45, proteine: 0.5 },
  { category: 'Bevande', name: 'Birra', default_unit: 'porzione', kcal: 43, proteine: 0.5 },
  { category: 'Bevande', name: 'Vino', default_unit: 'porzione', kcal: 83, proteine: 0.1 },

  // Dolcificanti e condimenti
  { category: 'Dolcificanti', name: 'Olio EVO', default_unit: 'cucchiaio', kcal: 884, proteine: 0 },
  { category: 'Dolcificanti', name: 'Miele', default_unit: 'cucchiaio', kcal: 304, proteine: 0.3 },
  { category: 'Dolcificanti', name: 'Zucchero', default_unit: 'cucchiaio', kcal: 387, proteine: 0 },
  { category: 'Dolcificanti', name: 'Burro', default_unit: 'g', kcal: 717, proteine: 0.9 },
  { category: 'Dolcificanti', name: 'Olive', default_unit: 'porzione', kcal: 115, proteine: 0.8 },
  { category: 'Dolcificanti', name: 'Salsa di soia', default_unit: 'cucchiaio', kcal: 53, proteine: 8 },
  { category: 'Dolcificanti', name: 'Marmellata', default_unit: 'cucchiaio', kcal: 250, proteine: 0.5 },

  // Snack e dolci
  { category: 'Snack e dolci', name: 'Cioccolato fondente', default_unit: 'g', kcal: 546, proteine: 4.9 },
  { category: 'Snack e dolci', name: 'Cioccolato al latte', default_unit: 'g', kcal: 535, proteine: 7.7 },
  { category: 'Snack e dolci', name: 'Biscotti secchi', default_unit: 'g', kcal: 410, proteine: 7 },
  { category: 'Snack e dolci', name: 'Sorbetto', default_unit: 'porzione', kcal: 120, proteine: 1 },
  { category: 'Snack e dolci', name: 'Noci', default_unit: 'g', kcal: 654, proteine: 15 },
  { category: 'Snack e dolci', name: 'Mandorle', default_unit: 'g', kcal: 579, proteine: 21 },
  { category: 'Snack e dolci', name: 'Nocciole', default_unit: 'g', kcal: 628, proteine: 15 },
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