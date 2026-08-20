import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Phone, Clock, Stethoscope } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import AppLayout from '@/components/AppLayout';
import PageHeader from '@/components/PageHeader';
import PageEditorial from '@/components/PageEditorial';
import EditorialBlock from '@/components/EditorialBlock';
import MagazineEssay from '@/components/MagazineEssay';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const typeMeta = {
  centro_ibd: { color: '#0d9488', bg: 'bg-emerald-50 text-emerald-700', label: 'Centro IBD' },
  bagno_pubblico: { color: '#0ea5e9', bg: 'bg-sky-50 text-sky-700', label: 'Bagno pubblico' },
  farmacia: { color: '#f59e0b', bg: 'bg-amber-50 text-amber-700', label: 'Farmacia' },
  pronto_soccorso: { color: '#ef4444', bg: 'bg-rose-50 text-rose-700', label: 'Pronto soccorso' },
};

function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 13); }, [position, map]);
  return null;
}

export default function ServicesMap() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.ServiceLocation.list('-created_date', 200);
        setItems(data);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  };

  const visible = filter === 'all' ? items : items.filter((i) => i.type === filter);

  return (
    <AppLayout>
      <PageHeader title={t('map.title')} subtitle={t('map.subtitle')} />
      <PageEditorial pageKey="map" />
      <MagazineEssay theme="mappa" number="01" eyebrow="Servizi" title="Mappa dei servizi">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={t('map.all')} />
        {Object.entries(typeMeta).map(([k, m]) => (
          <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)} label={m.label} />
        ))}
        <button onClick={locateMe} className="ml-auto whitespace-nowrap inline-flex items-center gap-1.5 text-sm font-medium text-primary px-3 py-1.5 rounded-full bg-primary/10">
          <Navigation className="w-4 h-4" /> La mia posizione
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border shadow-sm mb-6" style={{ height: 360 }}>
        <MapContainer center={[41.9, 12.5]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          {visible.map((loc) => (
            <CircleMarker key={loc.id} center={[loc.lat, loc.lng]} radius={9} pathOptions={{ color: typeMeta[loc.type]?.color || '#0d9488', fillColor: typeMeta[loc.type]?.color || '#0d9488', fillOpacity: 0.8 }}>
              <Popup>
                <strong>{loc.name}</strong><br />
                {typeMeta[loc.type]?.label}<br />
                {loc.address || ''} {loc.city || ''}
                {loc.phone ? <><br />{loc.phone}</> : null}
              </Popup>
            </CircleMarker>
          ))}
          {userPos && (
            <>
              <CircleMarker center={userPos} radius={7} pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.9 }} />
              <FlyToUser position={userPos} />
            </>
          )}
        </MapContainer>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t('common.loading')}</p>
      ) : visible.length === 0 ? (
        <EmptyState icon={MapPin} title={t('common.empty')} description="Nessun servizio in questa categoria. Gli amministratori possono aggiungerne dalla dashboard." />
      ) : (
        <div className="space-y-3">
          {visible.map((loc) => (
            <Card key={loc.id} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', typeMeta[loc.type]?.bg)}>
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{loc.name}</p>
                  <p className="text-sm text-muted-foreground">{typeMeta[loc.type]?.label}</p>
                  {loc.address && <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {loc.address}{loc.city ? ', ' + loc.city : ''}</p>}
                  <div className="flex gap-4 mt-1.5">
                    {loc.phone && <a href={`tel:${loc.phone}`} className="text-sm text-primary inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {loc.phone}</a>}
                    {loc.hours && <span className="text-sm text-muted-foreground inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {loc.hours}</span>}
                  </div>
                </div>
                <a
                  href={`https://www.openstreetmap.org/directions?from=&to=${loc.lat}%2C${loc.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary whitespace-nowrap"
                >
                  Indicazioni
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </MagazineEssay>
      <EditorialBlock sectionKey="map_safe" align="left" />
    </AppLayout>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={cn('whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors', active ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground')}
    >
      {label}
    </button>
  );
}