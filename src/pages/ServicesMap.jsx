import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Navigation } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import CentersMap from '@/components/ibd-centers/CentersMap';
import CentersSidebar from '@/components/ibd-centers/CentersSidebar';

const typeLabelsKeys = {
  centro_ibd: 'map.centro_ibd',
  bagno_pubblico: 'map.bagno_pubblico',
  farmacia: 'map.farmacia',
  pronto_soccorso: 'map.pronto_soccorso',
};

const inBounds = (loc, b) =>
  loc.lat <= b.n && loc.lat >= b.s && loc.lng <= b.e && loc.lng >= b.w;

export default function ServicesMap() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ country: '', region: '', city: '', search: '', type: '' });
  const [bounds, setBounds] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.ServiceLocation.list('-created_date', 1000);
        setItems(data);
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const typeLabel = useCallback((tp) => t(typeLabelsKeys[tp] || 'map.centro_ibd'), [t]);
  const typeLabels = useMemo(
    () => Object.fromEntries(Object.entries(typeLabelsKeys).map(([k, v]) => [k, t(v)])),
    [t]
  );

  const countries = useMemo(
    () => Array.from(new Set(items.map((i) => i.country).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [items]
  );
  const regions = useMemo(
    () => Array.from(new Set(items.filter((i) => i.country === filters.country).map((i) => i.region).filter(Boolean))).sort(),
    [items, filters.country]
  );
  const cities = useMemo(
    () => Array.from(new Set(items.filter((i) => i.country === filters.country && i.region === filters.region).map((i) => i.city).filter(Boolean))).sort(),
    [items, filters.country, filters.region]
  );

  const byControls = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return items.filter((i) => {
      if (filters.country && i.country !== filters.country) return false;
      if (filters.region && i.region !== filters.region) return false;
      if (filters.city && i.city !== filters.city) return false;
      if (filters.type && i.type !== filters.type) return false;
      if (q) {
        const hay = `${i.name} ${i.city || ''} ${i.region || ''} ${i.country || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filters]);

  const visible = useMemo(
    () => (bounds ? byControls.filter((i) => i.lat != null && inBounds(i, bounds)) : byControls),
    [byControls, bounds]
  );

  const fitPoints = useMemo(
    () => byControls.filter((i) => i.lat != null).map((i) => [i.lat, i.lng]),
    [byControls]
  );
  const fitTrigger = useMemo(
    () => `${filters.country}|${filters.region}|${filters.city}|${filters.search}|${filters.type}`,
    [filters]
  );

  const hasActive = !!(filters.country || filters.region || filters.city || filters.search || filters.type);

  const onFilter = useCallback((patch) => setFilters((f) => ({ ...f, ...patch })), []);
  const onReset = useCallback(() => setFilters({ country: '', region: '', city: '', search: '', type: '' }), []);
  const onBoundsChange = useCallback((b) => setBounds(b), []);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  };

  return (
    <AppLayout>
      <PageHeader title={t('map.title')} subtitle={t('map.subtitle')} />
      <PageEditorial pageKey="map" />

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{t('map.world_desc')}</p>
        <button onClick={locateMe} className="whitespace-nowrap inline-flex items-center gap-1.5 text-sm font-medium text-primary px-3 py-1.5 rounded-full bg-primary/10">
          <Navigation className="w-4 h-4" /> {t('map.my_location')}
        </button>
      </div>

      {/* Layout mappa + pannello laterale */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3 mb-6" style={{ height: 'min(70vh, 640px)' }}>
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm order-2 lg:order-1 min-h-[280px]">
          <CentersMap
            items={byControls}
            onBoundsChange={onBoundsChange}
            fitTrigger={fitTrigger}
            fitPoints={fitPoints}
            selectedId={selectedId}
            userPos={userPos}
            typeLabel={typeLabel}
          />
        </div>
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm order-1 lg:order-2 bg-background">
          <CentersSidebar
            items={visible}
            countries={countries}
            regions={regions}
            cities={cities}
            filters={filters}
            onFilter={onFilter}
            onReset={onReset}
            typeLabels={typeLabels}
            typeLabel={typeLabel}
            loading={loading}
            selectedId={selectedId}
            onSelect={setSelectedId}
            t={t}
            hasActive={hasActive}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">{t('map.disclaimer')}</p>
      <EditorialBlock sectionKey="map_safe" align="left" />
    </AppLayout>
  );
}