import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { Globe } from 'lucide-react';

const LANGS = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'pl', label: 'Polski' },
  { code: 'ro', label: 'Română' },
  { code: 'sq', label: 'Shqip' },
  { code: 'zh', label: '中文' },
];

export default function LanguageSwitcher({ className }) {
  const { lang, setLang } = useI18n();
  return (
    <Select value={lang} onValueChange={setLang}>
      <SelectTrigger className={className}>
        <Globe className="w-4 h-4 mr-1.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGS.map((l) => (
          <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}