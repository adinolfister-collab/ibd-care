import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const typeColor = {
  centro_ibd: '#0d9488',
  bagno_pubblico: '#0ea5e9',
  farmacia: '#f59e0b',
  pronto_soccorso: '#ef4444',
};

// Riferisce i bounds correnti della mappa al termine di ogni movimento.
function MapBoundsReporter({ onBoundsChange }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      const b = map.getBounds();
      onBoundsChange({ n: b.getNorth(), s: b.getSouth(), e: b.getEast(), w: b.getWest() });
    };
    map.on('moveend', handler);
    handler();
    return () => map.off('moveend', handler);
  }, [map, onBoundsChange]);
  return null;
}

// Vola sui risultati quando cambiano i filtri a cascata / ricerca (non al movimento mappa).
function MapFitter({ points, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.flyTo(points[0], 6, { duration: 0.7 });
      return;
    }
    const lats = points.map((p) => p[0]);
    const lngs = points.map((p) => p[1]);
    const n = Math.max(...lats), s = Math.min(...lats), e = Math.max(...lngs), w = Math.min(...lngs);
    const span = Math.max(n - s, e - w);
    let zoom = 3;
    if (span < 0.5) zoom = 10; else if (span < 2) zoom = 8; else if (span < 8) zoom = 5; else if (span < 20) zoom = 4;
    map.flyTo([(n + s) / 2, (e + w) / 2], zoom, { duration: 0.7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

// Centra la mappa sul centro selezionato dalla lista.
function SelectedPan({ center, selectedId }) {
  const map = useMap();
  useEffect(() => {
    if (selectedId && center) map.flyTo(center, 9, { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);
  return null;
}

export default function CentersMap({ items, onBoundsChange, fitTrigger, fitPoints, selectedId, userPos, typeLabel }) {
  const selected = items.find((i) => i.id === selectedId);
  return (
    <MapContainer center={[41.9, 12.5]} zoom={4} style={{ height: '100%', width: '100%' }} className="z-0">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      <MapBoundsReporter onBoundsChange={onBoundsChange} />
      <MapFitter points={fitPoints} trigger={fitTrigger} />
      <SelectedPan center={selected ? [selected.lat, selected.lng] : null} selectedId={selectedId} />
      {items.map((loc) => (
        <CircleMarker
          key={loc.id}
          center={[loc.lat, loc.lng]}
          radius={selectedId === loc.id ? 11 : 8}
          pathOptions={{
            color: typeColor[loc.type] || '#0d9488',
            fillColor: typeColor[loc.type] || '#0d9488',
            fillOpacity: selectedId === loc.id ? 0.95 : 0.75,
            weight: selectedId === loc.id ? 3 : 1,
          }}
        >
          <Popup>
            <strong>{loc.name}</strong><br />
            {typeLabel(loc.type)}<br />
            {[loc.city, loc.country].filter(Boolean).join(', ')}
          </Popup>
        </CircleMarker>
      ))}
      {userPos && (
        <CircleMarker center={userPos} radius={7} pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.9 }} />
      )}
    </MapContainer>
  );
}