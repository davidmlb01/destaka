'use client'

import { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapZone {
  lat: number
  lng: number
  label: string
  count: number
  status: 'strong' | 'medium' | 'weak'
}

interface MapContentProps {
  center: { lat: number; lng: number }
  zones: MapZone[]
}

const statusColors: Record<string, string> = {
  strong: '#22c55e',
  medium: '#eab308',
  weak: '#ef4444',
}

const statusOpacity: Record<string, number> = {
  strong: 0.5,
  medium: 0.35,
  weak: 0.2,
}

export default function MapContent({ center, zones }: MapContentProps) {
  const centerIcon = useMemo(() => L.divIcon({
    html: '<div style="width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 6px rgba(59,130,246,0.6);"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    className: '',
  }), [])
  return (
    <>
      <style>{`
        .dash-map .leaflet-tile-pane {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
        .dash-map .leaflet-overlay-pane { filter: none; }
        .dash-map .leaflet-marker-pane { filter: none; }
      `}</style>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        attributionControl={false}
        className="dash-map"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {zones.map((zone, i) => (
        <CircleMarker
          key={i}
          center={[zone.lat, zone.lng]}
          radius={Math.max(8, Math.min(25, zone.count / 2))}
          pathOptions={{
            fillColor: statusColors[zone.status] ?? '#6b7280',
            fillOpacity: statusOpacity[zone.status] ?? 0.3,
            color: statusColors[zone.status] ?? '#6b7280',
            weight: 1,
            opacity: 0.6,
          }}
        >
          <Popup>
            <span style={{ color: '#000', fontWeight: 500 }}>
              {zone.label}: {zone.count} buscas
            </span>
          </Popup>
        </CircleMarker>
      ))}

      <Marker position={[center.lat, center.lng]} icon={centerIcon}>
        <Popup>
          <span style={{ color: '#000', fontWeight: 500 }}>Seu negocio</span>
        </Popup>
      </Marker>
    </MapContainer>
    </>
  )
}
