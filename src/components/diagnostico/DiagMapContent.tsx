'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
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
}

const statusColors: Record<string, string> = {
  strong: '#14B8A6', // accent
  medium: '#FBBF24', // warning
  weak: '#EF4444',   // error
}

const statusOpacity: Record<string, number> = {
  strong: 0.5,
  medium: 0.35,
  weak: 0.2,
}

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

export default function DiagMapContent({ center, zones }: DiagMapContentProps) {
  const centerIcon = useMemo(() => L.divIcon({
    html: '<div style="width:14px;height:14px;background:#14B8A6;border:2px solid white;border-radius:50%;box-shadow:0 0 6px rgba(20,184,166,0.6);"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    className: '',
  }), [])

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
      attributionControl={false}
    >
      <InvalidateSize />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

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
  )
}
