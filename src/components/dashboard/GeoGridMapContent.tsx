'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapPoint {
  lat: number
  lng: number
  color: string
  label: string
  position: number | null
}

interface Props {
  center: { lat: number; lng: number }
  points: MapPoint[]
}

export default function GeoGridMapContent({ center, points }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Center marker (business location)
    L.circleMarker([center.lat, center.lng], {
      radius: 8,
      fillColor: '#fff',
      color: '#0EA5E9',
      weight: 3,
      fillOpacity: 1,
    }).addTo(map).bindPopup('Sua localização')

    // Grid point markers
    points.forEach(p => {
      const label = p.position !== null ? `${p.position}` : '–'
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 14,
        fillColor: p.color,
        color: 'rgba(0,0,0,0.3)',
        weight: 1,
        fillOpacity: 0.9,
      }).addTo(map)

      marker.bindPopup(`<div style="text-align:center;font-family:sans-serif"><b>${p.label}</b></div>`)

      // Add position number as a div icon overlay
      const icon = L.divIcon({
        className: 'geo-grid-label',
        html: `<span style="
          color: ${p.position !== null && p.position <= 3 ? '#000' : '#fff'};
          font-size: 11px;
          font-weight: 700;
          text-align: center;
          line-height: 28px;
          width: 28px;
          height: 28px;
          display: block;
          pointer-events: none;
        ">${label}</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      L.marker([p.lat, p.lng], { icon, interactive: false }).addTo(map)
    })

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [center, points])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
