import React from 'react';
import { MapPin } from 'lucide-react';
import CenterFilters from './CenterFilters';
import CenterCard from './CenterCard';
import EmptyState from '@/components/EmptyState';

export default function CentersSidebar({
  items, countries, regions, cities, filters, onFilter, onReset, typeLabels, typeLabel,
  loading, selectedId, onSelect, t, hasActive,
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border bg-card/60">
        <CenterFilters
          countries={countries}
          regions={regions}
          cities={cities}
          filters={filters}
          onFilter={onFilter}
          onReset={onReset}
          typeLabels={typeLabels}
          t={t}
          hasActive={hasActive}
        />
      </div>
      <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
        {loading ? t('common.loading') : `${items.length} ${t('map.results_count')}`}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {loading ? null : items.length === 0 ? (
          <EmptyState icon={MapPin} title={t('map.no_centers')} description={t('map.no_results_area')} />
        ) : (
          items.map((loc) => (
            <CenterCard key={loc.id} loc={loc} selected={selectedId === loc.id} onSelect={onSelect} typeLabel={typeLabel} t={t} />
          ))
        )}
      </div>
    </div>
  );
}