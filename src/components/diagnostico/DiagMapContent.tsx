'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
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

const compassLabels = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste']

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(timer)
  }, [map])
  return null
}

/** Gera 8 pontos cardeais ao redor do centro, espaçados pelo raio */
function buildGridPoints(
  center: { lat: number; lng: number },
  radiusKm: number,
  zones: MapZone[],
): Array<{ lat: number; lng: number; label: string; status: 'strong' | 'medium' | 'weak' }> {
  const offsetDeg = (radiusKm * 0.65) / 111
  const lngCorrection = Math.cos((center.lat * Math.PI) / 180)

  // 8 direções: N, NE, E, SE, S, SW, W, NW
  const directions = [
    { dLat: 1, dLng: 0 },
    { dLat: 0.7, dLng: 0.7 },
    { dLat: 0, dLng: 1 },
    { dLat: -0.7, dLng: 0.7 },
    { dLat: -1, dLng: 0 },
    { dLat: -0.7, dLng: -0.7 },
    { dLat: 0, dLng: -1 },
    { dLat: 0.7, dLng: -0.7 },
  ]

  return directions.map((dir, i) => {
    const ptLat = center.lat + dir.dLat * offsetDeg
    const ptLng = center.lng + (dir.dLng * offsetDeg) / lngCorrection

    // Procurar zona real mais próxima deste ponto
    let bestZone: MapZone | null = null
    let bestDist = Infinity
    for (const z of zones) {
      const dist = Math.sqrt(Math.pow(z.lat - ptLat, 2) + Math.pow(z.lng - ptLng, 2))
      if (dist < bestDist) {
        bestDist = dist
        bestZone = z
      }
    }

    // Se a zona mais próxima está dentro de tolerância, usar seu status
    const tolerance = offsetDeg * 0.8
    const status = bestZone && bestDist < tolerance ? bestZone.status : 'weak'
    const label = bestZone && bestDist < tolerance ? bestZone.label : compassLabels[i]

    return { lat: ptLat, lng: ptLng, label, status }
  })
}

export default function DiagMapContent({ center, zones, radiusKm }: DiagMapContentProps) {
  const gridPoints = useMemo(
    () => buildGridPoints(center, radiusKm, zones),
    [center, radiusKm, zones],
  )

  const zoom = radiusKm <= 2 ? 14 : radiusKm <= 5 ? 13 : 12

  return (
    <>
      <style>{`
        .diag-map .leaflet-tile-pane {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
        .diag-map .leaflet-overlay-pane { filter: none; }
        .diag-map .leaflet-marker-pane { filter: none; }
      `}</style>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
        className="diag-map"
      >
        <InvalidateSize />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 8 zonas ao redor */}
        {gridPoints.map((pt, i) => (
          <CircleMarker
            key={i}
            center={[pt.lat, pt.lng]}
            radius={22}
            pathOptions={{
              fillColor: statusColors[pt.status],
              fillOpacity: pt.status === 'strong' ? 0.55 : pt.status === 'medium' ? 0.4 : 0.3,
              color: statusColors[pt.status],
              weight: 2.5,
              opacity: 0.85,
            }}
          >
            <Popup>
              <span style={{ color: '#000', fontWeight: 500, fontSize: 13 }}>
                {pt.label}
              </span>
            </Popup>
          </CircleMarker>
        ))}

        {/* Centro = seu negócio (sempre verde) */}
        <CircleMarker
          center={[center.lat, center.lng]}
          radius={14}
          pathOptions={{
            fillColor: '#4ADE80',
            fillOpacity: 0.9,
            color: '#fff',
            weight: 3,
            opacity: 1,
          }}
        >
          <Popup>
            <span style={{ color: '#000', fontWeight: 600, fontSize: 13 }}>Seu negócio</span>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </>
  )
}
