// Centralizza la mappatura tra i valori enum delle entità e le chiavi i18n.
//
// I valori enum salvati nel DB (meal_type, reaction, cooking_method, unit,
// type, frequency, pain_location, mood, ...) restano immutati: qui si
// mappano solo le ETICHETTE da mostrare alle chiavi di traduzione.
//
// In un componente:
//   import { MEAL_TYPE_KEYS } from '@/lib/enumLabels';
//   const { t } = useI18n();
//   t(MEAL_TYPE_KEYS[meal_type])
// oppure con gli accessor:
//   import { mealTypeLabel } from '@/lib/enumLabels';
//   mealTypeLabel(t, meal_type)

export const MEAL_TYPE_KEYS = {
  colazione: 'meal.colazione',
  pranzo: 'meal.pranzo',
  cena: 'meal.cena',
  spuntino: 'meal.spuntino',
};

export const REACTION_KEYS = {
  nessuna: 'food.reaction_none',
  lieve: 'food.reaction_lievo',
  moderata: 'food.reaction_moderate',
  severa: 'food.reaction_severe',
};

export const COOKING_KEYS = {
  al_vapore: 'food.cooking_al_vapore',
  bollito: 'food.cooking_bollito',
  al_forno: 'food.cooking_al_forno',
  piastrato: 'food.cooking_piastrato',
  fritto: 'food.cooking_fritto',
  crudo: 'food.cooking_crudo',
};

export const UNIT_KEYS = {
  g: 'unit.g',
  ml: 'unit.ml',
  porzione: 'unit.porzione',
  cucchiaio: 'unit.cucchiaio',
  tazza: 'unit.tazza',
  fetta: 'unit.fetta',
};

export const MED_TYPE_KEYS = {
  farmaco_orale: 'meds.type_farmaco_orale',
  iniezione: 'meds.type_iniezione',
  biologico: 'meds.type_biologico',
  integratore: 'meds.type_integratore',
};

export const MED_FREQUENCY_KEYS = {
  giornaliero: 'meds.freq_giornaliero',
  settimanale: 'meds.freq_settimanale',
  bisettimanale: 'meds.freq_bisettimanale',
  mensile: 'meds.freq_mensile',
  al_bisogno: 'meds.freq_al_bisogno',
};

export const PAIN_LOCATION_KEYS = {
  addome_inferiore: 'symptoms.pain_location_addome_inferiore',
  addome_superiore: 'symptoms.pain_location_addome_superiore',
  fianco_dx: 'symptoms.pain_location_fianco_dx',
  fianco_sx: 'symptoms.pain_location_fianco_sx',
  generico: 'symptoms.pain_location_generico',
  nessuno: 'symptoms.pain_location_nessuno',
};

export const MOOD_KEYS = {
  buono: 'decorso.mood_buono',
  discreto: 'decorso.mood_discreto',
  giu: 'decorso.mood_giu',
  ansia: 'decorso.mood_ansia',
  irritabile: 'decorso.mood_irritabile',
};

export const BRISTOL_KEYS = {
  1: 'symptoms.bristol_1',
  2: 'symptoms.bristol_2',
  3: 'symptoms.bristol_3',
  4: 'symptoms.bristol_4',
  5: 'symptoms.bristol_5',
  6: 'symptoms.bristol_6',
  7: 'symptoms.bristol_7',
};

export const RECORD_TYPE_KEYS = {
  visita: 'exams.type_visita',
  esame: 'exams.type_esame',
  esame_sangue: 'exams.type_esame_sangue',
  referto: 'exams.type_referto',
  controllo: 'exams.type_controllo',
};

export const EXAM_CATEGORY_KEYS = {
  esame_sangue: 'exams.cat_esame_sangue',
  calprotectina: 'exams.cat_calprotectina',
  colonscopia: 'exams.cat_colonscopia',
  ecografia: 'exams.cat_ecografia',
};

export const SERVICE_TYPE_KEYS = {
  centro_ibd: 'map.centro_ibd',
  bagno_pubblico: 'map.bagno_pubblico',
  farmacia: 'map.farmacia',
  pronto_soccorso: 'map.pronto_soccorso',
};

export const COMMUNITY_CATEGORY_KEYS = {
  generale: 'community.cat_generale',
  consigli: 'community.cat_consigli',
  alimentazione: 'community.cat_alimentazione',
  sintomi: 'community.cat_sintomi',
  emotivo: 'community.cat_emotivo',
  altro: 'community.cat_altro',
};

export const PRODUCT_CATEGORY_KEYS = {
  nutrizione: 'shop.cat_nutrizione',
  stomia: 'shop.cat_stomia',
  comfort: 'shop.cat_comfort',
  igiene: 'shop.cat_igiene',
  farmaci: 'shop.cat_farmaci',
  integratori: 'shop.cat_integratori',
  dispositivi: 'shop.cat_dispositivi',
  cura_persona: 'shop.cat_cura_persona',
  alimentazione_speciale: 'shop.cat_alimentazione_speciale',
};

// Locale BCP47 per la formattazione di date/numeri in base alla lingua attiva.
export function localeForLang(lang) {
  const map = {
    it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
    pt: 'pt-PT', ru: 'ru-RU', pl: 'pl-PL', ro: 'ro-RO', sq: 'sq-AL', zh: 'zh-CN',
  };
  return map[lang] || 'it-IT';
}

// Accessor: restituiscono l'etichetta localizzata o il valore grezzo se mancante.
export const mealTypeLabel = (t, v) => (MEAL_TYPE_KEYS[v] ? t(MEAL_TYPE_KEYS[v]) : v);
export const reactionLabel = (t, v) => (REACTION_KEYS[v] ? t(REACTION_KEYS[v]) : v);
export const cookingLabel = (t, v) => (COOKING_KEYS[v] ? t(COOKING_KEYS[v]) : v);
export const unitLabel = (t, v) => (UNIT_KEYS[v] ? t(UNIT_KEYS[v]) : v);
export const medTypeLabel = (t, v) => (MED_TYPE_KEYS[v] ? t(MED_TYPE_KEYS[v]) : v);
export const medFrequencyLabel = (t, v) => (MED_FREQUENCY_KEYS[v] ? t(MED_FREQUENCY_KEYS[v]) : v);
export const painLocationLabel = (t, v) => (PAIN_LOCATION_KEYS[v] ? t(PAIN_LOCATION_KEYS[v]) : v);
export const moodLabel = (t, v) => (MOOD_KEYS[v] ? t(MOOD_KEYS[v]) : v);
export const bristolLabel = (t, v) => (BRISTOL_KEYS[v] ? t(BRISTOL_KEYS[v]) : v);
export const recordTypeLabel = (t, v) => (RECORD_TYPE_KEYS[v] ? t(RECORD_TYPE_KEYS[v]) : v);
export const examCategoryLabel = (t, v) => (EXAM_CATEGORY_KEYS[v] ? t(EXAM_CATEGORY_KEYS[v]) : v);
export const serviceTypeLabel = (t, v) => (SERVICE_TYPE_KEYS[v] ? t(SERVICE_TYPE_KEYS[v]) : v);
export const communityCategoryLabel = (t, v) => (COMMUNITY_CATEGORY_KEYS[v] ? t(COMMUNITY_CATEGORY_KEYS[v]) : v);
export const productCategoryLabel = (t, v) => (PRODUCT_CATEGORY_KEYS[v] ? t(PRODUCT_CATEGORY_KEYS[v]) : v);