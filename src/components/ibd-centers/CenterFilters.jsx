import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const typeMeta = {
  centro_ibd: { color: '#0d9488', bg: 'bg-emerald-50 text-emerald-700' },
  bagno_pubblico: { color: '#0ea5e9', bg: 'bg-sky-50 text-sky-700' },
  farmacia: { color: '#f59e0b', bg: 'bg-amber-50 text-amber-700' },
  pronto_soccorso: { color: '#ef4444', bg: 'bg-rose-50 text-rose-700' },
};

export default function CenterFilters({
  countries, regions, cities, filters, onFilter, onReset, typeLabels, t, hasActive,
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onFilter({ search: e.target.value })}
          placeholder={t('map.search_placeholder')}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-2">
        <Select value={filters.country || 'all'} onValueChange={(v) => onFilter({ country: v === 'all' ? '' : v, region: '', city: '' })}>
          <SelectTrigger className="w-full"><SelectValue placeholder={t('map.all_countries')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('map.all_countries')}</SelectItem>
            {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.region || 'all'} onValueChange={(v) => onFilter({ region: v === 'all' ? '' : v, city: '' })} disabled={!filters.country}>
          <SelectTrigger className="w-full"><SelectValue placeholder={t('map.all_regions')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('map.all_regions')}</SelectItem>
            {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.city || 'all'} onValueChange={(v) => onFilter({ city: v === 'all' ? '' : v })} disabled={!filters.region}>
          <SelectTrigger className="w-full"><SelectValue placeholder={t('map.all_cities')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('map.all_cities')}</SelectItem>
            {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {Object.entries(typeMeta).map(([k, m]) => (
          <button
            key={k}
            onClick={() => onFilter({ type: filters.type === k ? '' : k })}
            className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              filters.type === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border')}
          >
            {typeLabels[k]}
          </button>
        ))}
        {hasActive && (
          <button onClick={onReset} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground px-2">
            <X className="w-3.5 h-3.5" /> {t('common.reset')}
          </button>
        )}
      </div>
    </div>
  );
}