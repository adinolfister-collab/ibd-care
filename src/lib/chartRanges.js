// Set standard di range temporali per i grafici (Trends, Grafici sintomi,
// Correlazioni). Il range 7gg è libero in sola lettura; tutti gli altri
// sono Premium con lucchetto.
//
// Ogni range:
//   key       id stabile usato dal selettore
//   labelKey  chiave i18n per l'etichetta
//   days      numero di giorni della finestra (null = storico completo)
//   premium   true se riservato agli abbonati
export const CHART_RANGES = [
  { key: '7g', labelKey: 'chart.range.7g', days: 7, premium: false },
  { key: '15g', labelKey: 'chart.range.15g', days: 15, premium: true },
  { key: '30g', labelKey: 'chart.range.month', days: 30, premium: true },
  { key: '90g', labelKey: 'chart.range.months', days: 90, premium: true },
  { key: 'full', labelKey: 'chart.range.full', days: null, premium: true },
];

// Range libero (sola lettura) e range selezionato di default all'apertura.
export const FREE_RANGE_KEY = '7g';
export const DEFAULT_RANGE_KEY = '7g';

export function getRange(key) {
  return CHART_RANGES.find((r) => r.key === key) || CHART_RANGES[0];
}

export function isPremiumRangeKey(key) {
  const r = getRange(key);
  return !!r && r.premium;
}

// Restituisce la data di cutoff (ISO YYYY-MM-DD, inclusa) per il range;
// null per lo storico completo (nessun cutoff).
export function cutoffDateForRange(range) {
  if (!range || range.days == null) return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (range.days - 1));
  return d.toISOString().slice(0, 10);
}

// Limite di caricamento dati suggerito per il range: per lo storico
// completo carica molti più record, altrimenti un valore ampio ma
// ragionevole per le finestre fino a 90 giorni.
export function listLimitForRange(range) {
  if (!range) return 1000;
  return range.days == null ? 5000 : 1000;
}