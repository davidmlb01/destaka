/**
 * Geo Analyzer: classifica regioes de driving directions em zonas de alcance.
 * Fonte de dados: GBP API v4 reportInsights (driving direction metrics).
 */

export interface GeoRegion {
  lat: number
  lng: number
  label: string
  count: number
  status: 'strong' | 'medium' | 'weak'
}

export interface GeoSnapshot {
  center: { lat: number; lng: number }
  zones: GeoRegion[]
  radius_km: number
  total_neighborhoods: number
}

interface RawRegionCount {
  latlng?: { latitude?: number; longitude?: number }
  label?: string
  count?: number | string
}

/**
 * Calcula distancia em km entre dois pontos (formula Haversine).
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Classifica regioes em zonas baseado na posicao no ranking.
 * Top 3 = strong, 4-7 = medium, 8-10 = weak.
 */
export function classifyRegions(
  rawRegions: RawRegionCount[],
  centerLat: number,
  centerLng: number
): GeoSnapshot {
  const zones: GeoRegion[] = []
  let maxDistance = 0

  for (let i = 0; i < rawRegions.length; i++) {
    const r = rawRegions[i]
    const lat = r.latlng?.latitude
    const lng = r.latlng?.longitude
    if (lat == null || lng == null) continue

    const count = typeof r.count === 'string' ? parseInt(r.count, 10) : (r.count ?? 0)
    const label = r.label ?? `Regiao ${i + 1}`

    let status: 'strong' | 'medium' | 'weak'
    if (i < 3) status = 'strong'
    else if (i < 7) status = 'medium'
    else status = 'weak'

    const distance = haversineKm(centerLat, centerLng, lat, lng)
    if (distance > maxDistance) maxDistance = distance

    zones.push({ lat, lng, label, count, status })
  }

  return {
    center: { lat: centerLat, lng: centerLng },
    zones,
    radius_km: Math.round(maxDistance * 10) / 10 || 5,
    total_neighborhoods: zones.length,
  }
}
