// Template preconfigurati per la dashboard marketing admin.
// Ogni template precompila argomento, tono suggerito e CTA.
export const SOCIAL_TEMPLATES = [
  {
    id: 'launch',
    label: 'Lancio app',
    topic: 'IBD Care è online: il diario di salute privato per chi vive con Crohn o colite ulcerosa. Sintomi, alimentazione, terapie, esami e community, in un\'unica app.',
    tone: 'incoraggiante',
    cta: 'Prova gratuita 14 giorni, poi da €0,99/mese',
  },
  {
    id: 'founders',
    label: 'Campagna Founder',
    topic: 'I primi 50 della community ricevono Premium a vita. Aderisci e pubblica un messaggio: chi crede in IBD Care per primo viene premiato per sempre.',
    tone: 'entusiasta',
    cta: 'Aderisci ora alla campagna Founder',
  },
  {
    id: 'diary',
    label: 'Diario sintomi',
    topic: 'Registrare ogni giorno dolore, stanchezza e scariche aiuta a capire la tua malattia e a spiegarla meglio al medico. Bastano 30 secondi al giorno.',
    tone: 'rassicurante',
    cta: 'Inizia il tuo diario oggi, prova gratuita',
  },
  {
    id: 'trial',
    label: 'Prova gratuita',
    topic: '14 giorni di prova gratuita, senza pubblicità e senza impegno: tutte le funzioni di IBD Care aperte a chiunque voglia capire se è la app giusta.',
    tone: 'sereno',
    cta: 'Crea un account con prova gratuita',
  },
  {
    id: 'scanner',
    label: 'Scanner esami',
    topic: 'Scansiona i referti con il telefono: l\'AI estrae i valori e crea una cronologia con confronto nel tempo, pronta per la visita specialistica.',
    tone: 'pratico',
    cta: 'Prova lo scanner esami, 14 giorni gratis',
  },
  {
    id: 'community',
    label: 'Community',
    topic: 'Non sei solo: nella community IBD Care trovi chi vive la tua stessa condizione, in 11 lingue, con traduzione automatica dei messaggi.',
    tone: 'caloroso',
    cta: 'Unisciti alla community, prova gratuita',
  },
];

export const PLATFORMS = [
  { id: 'facebook', label: 'Facebook / IG', accent: 'text-blue-600' },
  { id: 'linkedin', label: 'LinkedIn', accent: 'text-sky-700' },
  { id: 'x', label: 'X / Twitter', accent: 'text-slate-800' },
  { id: 'instagram', label: 'Instagram', accent: 'text-pink-600' },
];

export const TONES = ['incoraggiante', 'rassicurante', 'pratico', 'entusiasta', 'sereno', 'caloroso', 'professionale'];

export const LANGS = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'pl', label: 'Polski' },
  { code: 'ro', label: 'Română' },
  { code: 'sq', label: 'Shqip' },
  { code: 'zh', label: '中文' },
];

// Base URL usata per comporre i deep link nei post social.
// Personalizzabile: dominio custom se connesso, fallback sul dominio base44.
export const APP_BASE_URL = 'https://ibd-care.base44.app';

// Pagine dell'app selezionabili come deep link da includere nei post.
// Il primo elemento (path vuoto) equivale a "nessun link".
export const APP_PAGES = [
  { path: '', label: 'Nessun link' },
  { path: '/', label: 'Home' },
  { path: '/founders', label: 'Campagna Founder' },
  { path: '/abbonamento', label: 'Abbonamento' },
  { path: '/community', label: 'Community' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contatti' },
  { path: '/news', label: 'News IBD' },
  { path: '/symptoms', label: 'Diario sintomi' },
  { path: '/assistant', label: 'Assistente AI' },
];