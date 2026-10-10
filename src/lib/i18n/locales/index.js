// Aggrega tutti i dizionari per-lingua in un unico oggetto.
import it from './it';
import en from './en';
import es from './es';
import fr from './fr';
import de from './de';
import pt from './pt';
import ru from './ru';
import pl from './pl';
import ro from './ro';
import sq from './sq';
import zh from './zh';

import accessCopy from './accessCopy';

const base = { it, en, es, fr, de, pt, ru, pl, ro, sq, zh };
export const dictionaries = Object.fromEntries(
  Object.entries(base).map(([code, dict]) => [code, { ...dict, ...(accessCopy[code] || {}) }])
);

export const supportedLanguages = [
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'sq', label: 'Shqip', flag: '🇦🇱' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export default dictionaries;