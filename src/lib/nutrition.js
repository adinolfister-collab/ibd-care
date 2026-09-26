// Helper per il calcolo nutrizionale (calorie, proteine e carboidrati) dei pasti.
//
// I valori del catalogo sono espressi per 100 g (o 100 ml). Per le unità di
// dose non ponderali (porzione, cucchiaio, tazza, fetta) si usa il peso
// equivalente in grammi: se il catalogo fornisce portion_grams per il singolo
// alimento (es. Pera = 130 g), si usa quello; altrimenti si ricade sui pesi
// standard convenzionali (UNIT_GRAMS). I risultati sono arrotondati e indicati
// come approssimativi in UI.

import { DEFAULT_CATALOG } from '@/lib/foodCatalog';

// Mappa nome -> voce del catalogo di default (usata come fallback nutrizionale
// quando il catalogo admin non ha ancora i valori kcal/proteine/carboidrati
// per un cibo, o non ha portion_grams).
const DEFAULT_CATALOG_MAP = new Map(
  DEFAULT_CATALOG.map((c) => [c.name, c])
);

// Peso in grammi equivalente per 1 unità di ciascuna unità di dose (fallback
// quando il catalogo non specifica portion_grams per l'alimento).
export const UNIT_GRAMS = {
  g: 1,
  ml: 1,
  porzione: 150,
  cucchiaio: 15,
  tazza: 240,
  fetta: 30,
};

// Restituisce i grammi equivalenti di una porzione dell'alimento per la unità
// indicata: usa portion_grams del catalogo per le unità non ponderali, con
// fallback ai pesi standard.
function unitGrams(unit, catalogEntry) {
  if (unit === 'g' || unit === 'ml') return 1;
  if (catalogEntry && Number(catalogEntry.portion_grams) > 0) {
    return Number(catalogEntry.portion_grams);
  }
  return UNIT_GRAMS[unit] ?? 1;
}

// Converte una quantità + unità in grammi equivalenti.
export function qtyToGrams(qty, unit, catalogEntry) {
  const n = parseFloat(qty);
  if (!n || !isFinite(n) || n <= 0) return 0;
  return n * unitGrams(unit, catalogEntry);
}

// Arrotonda mantenendo una cifra decimale per le proteine e i carboidrati.
function round1(n) {
  return Math.round(n * 10) / 10;
}

// Calcola kcal, proteine e carboidrati totali di un item a partire dai valori
// per 100g del catalogo e dalla quantità/unità inserita dall'utente.
export function computeItemNutrition(item, catalogEntry) {
  if (!catalogEntry) return { kcal: 0, proteine: 0, carboidrati: 0 };
  const grams = qtyToGrams(item.qty, item.unit || catalogEntry.default_unit, catalogEntry);
  const kcal = Math.round((grams / 100) * (Number(catalogEntry.kcal) || 0));
  const proteine = round1((grams / 100) * (Number(catalogEntry.proteine) || 0));
  const carboidrati = round1((grams / 100) * (Number(catalogEntry.carboidrati) || 0));
  return { kcal, proteine, carboidrati };
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
// (item.kcal/proteine/carboidrati) se presente, altrimenti ricalcola dal
// catalogo (con fallback al catalogo di default per nome se la voce admin non
// ha i valori o non ha portion_grams).
export function resolveItemNutrition(item, catalogMap) {
  if (typeof item.kcal === 'number' && item.kcal >= 0 && item.proteine != null) {
    return {
      kcal: item.kcal,
      proteine: Number(item.proteine) || 0,
      carboidrati: typeof item.carboidrati === 'number' ? item.carboidrati : 0,
      source: item.kcal_source || null,
    };
  }
  let cat = catalogMap ? catalogMap.get(item.name) : null;
  if (!cat || (cat.kcal == null && cat.proteine == null && cat.carboidrati == null)) {
    const fallback = DEFAULT_CATALOG_MAP.get(item.name);
    if (fallback) cat = { ...fallback, ...(cat || {}) };
  }
  const n = computeItemNutrition(item, cat);
  return { kcal: n.kcal, proteine: n.proteine, carboidrati: n.carboidrati, source: cat ? 'catalog' : null };
}

// Totale giornaliero di kcal, proteine e carboidrati da una lista di pasti
// (FoodEntry) di una stessa giornata. Restituisce anche l'elenco dei cibi con i
// relativi valori.
export function computeDayTotals(entries, catalogMap) {
  let kcal = 0;
  let proteine = 0;
  let carboidrati = 0;
  const foods = [];
  (entries || []).forEach((e) => {
    const items = Array.isArray(e.items) ? e.items : [];
    items.forEach((it) => {
      if (!it || !it.name) return;
      const { kcal: k, proteine: p, carboidrati: c } = resolveItemNutrition(it, catalogMap);
      kcal += k;
      proteine += p;
      carboidrati += c;
      if (k > 0 || p > 0 || c > 0) {
        foods.push({ name: it.name, kcal: k, proteine: p, carboidrati: c });
      }
    });
  });
  return { kcal: Math.round(kcal), proteine: round1(proteine), carboidrati: round1(carboidrati), foods };
}