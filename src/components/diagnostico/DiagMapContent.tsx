'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapZone {
  lat: number
  lng: number
  label: string
  count: number
  status: 'strong' | 'medium' | 'weak'
}

interface DiagMapContentProps {
  center: { lat: number; lng: number }
  zones: MapZone[]
  radiusKm: number
}

const statusColors: Record<string, string> = {
  strong: '#4ADE80',
  medium: '#FBBF24',
  weak: '#EF4444',
}

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

export default function DiagMapContent({ center, zones, radiusKm }: DiagMapContentProps) {
  const centerIcon = useMemo(() => L.divIcon({
    html: `<div style="width:16px;height:16px;background:#14B8A6;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(20,184,166,0.8);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: '',
  }), [])

  const zoom = radiusKm <= 2 ? 14 : radiusKm <= 5 ? 13 : 12

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
      attributionControl={false}
    >
      <InvalidateSize />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      {/* Raio de alcance */}
      <Circle
        center={[center.lat, center.lng]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: '#14B8A6',
          weight: 2,
          opacity: 0.4,
          fillColor: '#14B8A6',
          fillOpacity: 0.06,
          dashArray: '8, 6',
        }}
      />

      {/* Zonas de presença */}
      {zones.map((zone, i) => (
        <CircleMarker
          key={i}
          center={[zone.lat, zone.lng]}
          radius={zone.status === 'strong' ? 20 : zone.status === 'medium' ? 15 : 12}
          pathOptions={{
            fillColor: statusColors[zone.status] ?? '#6b7280',
            fillOpacity: zone.status === 'strong' ? 0.45 : zone.status === 'medium' ? 0.3 : 0.2,
            color: statusColors[zone.status] ?? '#6b7280',
            weight: 2,
            opacity: 0.7,
          }}
        >
          <Popup>
            <span style={{ color: '#000', fontWeight: 500, fontSize: 13 }}>
              {zone.label}
            </span>
          </Popup>
        </CircleMarker>
      ))}

      {/* Marcador central */}
      <Marker position={[center.lat, center.lng]} icon={centerIcon}>
        <Popup>
          <span style={{ color: '#000', fontWeight: 600, fontSize: 13 }}>Seu negócio</span>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
