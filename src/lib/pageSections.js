// Mappa un pathname dell'app a una macro-sezione per il tracking page-view.
// Usato dal beacon lato client; le sezioni devono restare allineate con
// l'enum dell'entita' PageView.
const DIARY_PATHS = [
  '/symptoms', '/food', '/meds', '/records', '/esami',
  '/trends', '/symptom-charts', '/correlazioni',
];

export function mapPathToSection(pathname) {
  const p = pathname || '/';
  if (
    p === '/' ||
    p.startsWith('/about') ||
    p.startsWith('/contact') ||
    p.startsWith('/founders') ||
    p.startsWith('/news')
  ) {
    return 'Home';
  }
  if (DIARY_PATHS.some((s) => p === s || p.startsWith(s + '/'))) return 'Diario';
  if (p.startsWith('/shop')) return 'Negozio';
  if (p.startsWith('/community')) return 'Community';
  if (p.startsWith('/abbonamento')) return 'Abbonamento';
  if (p.startsWith('/account') || p.startsWith('/settings')) return 'Account';
  return 'Altro';
}

export const PAGE_SECTIONS = [
  'Home', 'Diario', 'Negozio', 'Community', 'Abbonamento', 'Account', 'Altro',
];