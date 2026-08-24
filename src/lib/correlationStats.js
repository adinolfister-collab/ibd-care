// Logica di aggregazione condivisa tra MealSymptomCorrelation e la pagina
// Correlazioni: splitting cibi, mappa sintomi per data e correlazione
// cibo -> valori sintomo nei giorni successivi al consumo.

// Spezza la stringa "foods" nei singoli alimenti.
export function splitItems(foods) {
  return String(foods || '')
    .split(/[\n,;·•]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

// Mappa entry_date -> ultima SymptomEntry di quella data (per created_date).
export function buildSymptomMap(entries) {
  const symMap = new Map();
  (entries || []).forEach((e) => {
    if (!e.entry_date) return;
    const prev = symMap.get(e.entry_date);
    if (!prev || (e.created_date || '') > (prev.created_date || '')) {
      symMap.set(e.entry_date, e);
    }
  });
  return symMap;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Per ogni cibo distinto, calcola la media di bowel_movements_count e pain_level
// nei `days` giorni successivi al consumo (giorno 0 = giorno del consumo),
// e il numero di occorrenze. Ritorna array ordinato per occorrenze desc.
export function computeFoodCorrelation(foods, symMap, days = 2) {
  const acc = new Map();
  (foods || []).forEach((f) => {
    if (!f.entry_date) return;
    const keys = [];
    for (let i = 0; i <= days; i++) keys.push(addDays(f.entry_date, i));
    const syms = keys.map((k) => symMap.get(k)).filter(Boolean);
    if (syms.length === 0) return;
    const bowelSum = syms.reduce((s, x) => s + (x.bowel_movements_count ?? 0), 0);
    const painVals = syms.map((x) => x.pain_level).filter((v) => v != null);
    splitItems(f.foods).forEach((item) => {
      const cur = acc.get(item) || { item, count: 0, bowelSum: 0, painSum: 0, painN: 0, occ: 0 };
      cur.count += 1;
      cur.occ += syms.length;
      cur.bowelSum += bowelSum / syms.length;
      if (painVals.length > 0) cur.painSum += painVals.reduce((s, v) => s + v, 0) / painVals.length;
      cur.painN += painVals.length > 0 ? 1 : 0;
      acc.set(item, cur);
    });
  });
  return Array.from(acc.values())
    .map((r) => ({
      item: r.item,
      count: r.count,
      avgBowel: +(r.bowelSum / r.count).toFixed(1),
      avgPain: r.painN > 0 ? +(r.painSum / r.painN).toFixed(1) : null,
    }))
    .sort((a, b) => b.count - a.count);
}