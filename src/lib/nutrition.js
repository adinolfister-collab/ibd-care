// Helper per il calcolo nutrizionale (calorie e proteine) dei pasti.
//
// I valori del catalogo sono espressi per 100 g (o 100 ml). Per le unità di
// dose non ponderali (porzione, cucchiaio, tazza, fetta) si usa un peso
// equivalente in grammi convenzionale, sufficiente per una stima diaristica.
// I risultati sono arrotondati e indicati come approssimativi in UI.

import { DEFAULT_CATALOG } from '@/lib/foodCatalog';

// Mappa nome -> voce del catalogo di default (usata come fallback nutrizionale
// quando il catalogo admin non ha ancora i valori kcal/proteine per un cibo).
const DEFAULT_CATALOG_MAP = new Map(
  DEFAULT_CATALOG.map((c) => [c.name, c])
);

// Peso in grammi equivalente per 1 unità di ciascuna unità di dose.
export const UNIT_GRAMS = {
  g: 1,
  ml: 1,
  porzione: 150,
  cucchiaio: 15,
  tazza: 240,
  fetta: 30,
};

// Converte una quantità + unità in grammi equivalenti.
export function qtyToGrams(qty, unit) {
  const n = parseFloat(qty);
  if (!n || !isFinite(n) || n <= 0) return 0;
  const per = UNIT_GRAMS[unit] ?? 1;
  return n * per;
}

// Arrotonda mantenendo una cifra decimale per le proteine.
function round1(n) {
  return Math.round(n * 10) / 10;
}

// Calcola kcal e proteine totali di un item a partire dai valori per 100g
// del catalogo e dalla quantità/unità inserita dall'utente.
export function computeItemNutrition(item, catalogEntry) {
  if (!catalogEntry) return { kcal: 0, proteine: 0 };
  const grams = qtyToGrams(item.qty, item.unit || catalogEntry.default_unit);
  const kcal = Math.round((grams / 100) * (Number(catalogEntry.kcal) || 0));
  const proteine = round1((grams / 100) * (Number(catalogEntry.proteine) || 0));
  return { kcal, proteine };
}

// Costruisce una mappa nome -> voce del catalogo a partire dai gruppi
// restituiti da catalogToGroups (usata per il lookup nutrizionale).
export function buildCatalogMap(groups) {
  const m = new Map();
  (groups || []).forEach((g) => {
    (g.items || []).forEach((it) => {
      if (it && it.name) m.set(it.name, it);
    });
  });
  return m;
}

// Risolve i valori nutrizionali di un item: usa lo snapshot salvato
// (item.kcal/proteine) se presente, altrimenti ricalcola dal catalogo (con
// fallback al catalogo di default per nome se la voce admin non ha i valori).
export function resolveItemNutrition(item, catalogMap) {
  if (typeof item.kcal === 'number' && item.kcal >= 0 && item.proteine != null) {
    return { kcal: item.kcal, proteine: Number(item.proteine) || 0, source: item.kcal_source || null };
  }
  let cat = catalogMap ? catalogMap.get(item.name) : null;
  if (!cat || (cat.kcal == null && cat.proteine == null)) {
    const fallback = DEFAULT_CATALOG_MAP.get(item.name);
    if (fallback) cat = { ...fallback, ...(cat || {}) };
  }
  const n = computeItemNutrition(item, cat);
  return { kcal: n.kcal, proteine: n.proteine, source: cat ? 'catalog' : null };
}

// Totale giornaliero di kcal e proteine da una lista di pasti (FoodEntry) di
// una stessa giornata. Restituisce anche l'elenco dei cibi con i relativi valori.
export function computeDayTotals(entries, catalogMap) {
  let kcal = 0;
  let proteine = 0;
  const foods = [];
  (entries || []).forEach((e) => {
    const items = Array.isArray(e.items) ? e.items : [];
    items.forEach((it) => {
      if (!it || !it.name) return;
      const { kcal: k, proteine: p } = resolveItemNutrition(it, catalogMap);
      kcal += k;
      proteine += p;
      if (k > 0 || p > 0) {
        foods.push({ name: it.name, kcal: k, proteine: p });
      }
    });
  });
  return { kcal: Math.round(kcal), proteine: round1(proteine), foods };
}