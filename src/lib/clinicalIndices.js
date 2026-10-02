// Logica di calcolo degli indici clinici ufficiali usati in gastroenterologia.
// HBI (Harvey-Bradshaw Index) per il Morbo di Crohn e Partial Mayo Score per
// la Colite Ulcerosa. Nessun dato di laboratorio o endoscopico richiesto.
//
// Riferimenti:
//  - HBI: Harvey RF, Bradshaw JM. Lancet 1980. Scala 0-32+.
//    Severita': <5 remissione, 5-7 lieve, 8-16 moderata, >16 grave.
//  - Partial Mayo: Schroeder et al. (sotto-punteggio 0-9 senza endoscopia).
//    Severita': 0 remissione, 1-2 lieve, 3-5 moderata, 6-9 grave.

export const HBI_COMPLICATIONS = [
  { value: 'artralgia', labelKey: 'clinical.hbi_comp_artralgia' },
  { value: 'uveite', labelKey: 'clinical.hbi_comp_uveite' },
  { value: 'eritema_nodoso', labelKey: 'clinical.hbi_comp_eritema_nodoso' },
  { value: 'afte_orali', labelKey: 'clinical.hbi_comp_afte_orali' },
  { value: 'ascessi', labelKey: 'clinical.hbi_comp_ascessi' },
  { value: 'fistole', labelKey: 'clinical.hbi_comp_fistole' },
  { value: 'fessurazioni', labelKey: 'clinical.hbi_comp_fessurazioni' },
];

export const HBI_WELLBEING = [
  { value: 0, labelKey: 'clinical.hbi_wellbeing_0' },
  { value: 1, labelKey: 'clinical.hbi_wellbeing_1' },
  { value: 2, labelKey: 'clinical.hbi_wellbeing_2' },
  { value: 3, labelKey: 'clinical.hbi_wellbeing_3' },
  { value: 4, labelKey: 'clinical.hbi_wellbeing_4' },
];

export const HBI_PAIN = [
  { value: 0, labelKey: 'clinical.hbi_pain_0' },
  { value: 1, labelKey: 'clinical.hbi_pain_1' },
  { value: 2, labelKey: 'clinical.hbi_pain_2' },
  { value: 3, labelKey: 'clinical.hbi_pain_3' },
];

export const HBI_MASS = [
  { value: 0, labelKey: 'clinical.hbi_mass_0' },
  { value: 1, labelKey: 'clinical.hbi_mass_1' },
  { value: 2, labelKey: 'clinical.hbi_mass_2' },
  { value: 3, labelKey: 'clinical.hbi_mass_3' },
];

export const MAYO_STOOL = [
  { value: 0, labelKey: 'clinical.mayo_stool_0' },
  { value: 1, labelKey: 'clinical.mayo_stool_1' },
  { value: 2, labelKey: 'clinical.mayo_stool_2' },
  { value: 3, labelKey: 'clinical.mayo_stool_3' },
];

export const MAYO_BLEEDING = [
  { value: 0, labelKey: 'clinical.mayo_bleeding_0' },
  { value: 1, labelKey: 'clinical.mayo_bleeding_1' },
  { value: 2, labelKey: 'clinical.mayo_bleeding_2' },
  { value: 3, labelKey: 'clinical.mayo_bleeding_3' },
];

export const MAYO_GLOBAL = [
  { value: 0, labelKey: 'clinical.mayo_global_0' },
  { value: 1, labelKey: 'clinical.mayo_global_1' },
  { value: 2, labelKey: 'clinical.mayo_global_2' },
  { value: 3, labelKey: 'clinical.mayo_global_3' },
];

// Calcola il punteggio HBI e l'etichetta di severita'.
// answers: { wellbeing (0-4), abdominal_pain (0-3), liquid_stools (numero>=0), abdominal_mass (0-3) }
// complications: array di valori da HBI_COMPLICATIONS
export function calcHBI(answers = {}, complications = []) {
  const wellbeing = Number(answers.wellbeing) || 0;
  const abdominalPain = Number(answers.abdominal_pain) || 0;
  const liquidStools = Math.max(0, Number(answers.liquid_stools) || 0);
  const abdominalMass = Number(answers.abdominal_mass) || 0;
  const compScore = Array.isArray(complications) ? complications.length : 0;
  const score = wellbeing + abdominalPain + liquidStools + compScore + abdominalMass;
  return { score, severity: hbiSeverity(score) };
}

export function hbiSeverity(score) {
  if (score < 5) return 'remissione';
  if (score <= 7) return 'lieve';
  if (score <= 16) return 'moderata';
  return 'grave';
}

// Calcola il punteggio Partial Mayo e l'etichetta di severita'.
// answers: { stool_frequency (0-3), rectal_bleeding (0-3), global_assessment (0-3) }
export function calcPartialMayo(answers = {}) {
  const stool = Number(answers.stool_frequency) || 0;
  const bleeding = Number(answers.rectal_bleeding) || 0;
  const global = Number(answers.global_assessment) || 0;
  const score = stool + bleeding + global;
  return { score, severity: mayoSeverity(score) };
}

export function mayoSeverity(score) {
  if (score === 0) return 'remissione';
  if (score <= 2) return 'lieve';
  if (score <= 5) return 'moderata';
  return 'grave';
}

// Etichetta localizzata di severita'.
export function severityLabelKey(severity) {
  return `clinical.severity_${severity}`;
}

// Colore associato alla severita' (per badge e grafici).
export function severityColor(severity) {
  switch (severity) {
    case 'remissione': return '#10b981';
    case 'lieve': return '#f59e0b';
    case 'moderata': return '#f97316';
    case 'grave': return '#ef4444';
    default: return '#64748b';
  }
}