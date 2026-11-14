// Google Places API — descoberta de concorrentes por especialidade + localização
// Requer GOOGLE_MAPS_API_KEY (chave de servidor, não OAuth)

import { getEngineContext } from '@/lib/vertical-vocab'

export interface PlaceResult {
  place_id: string
  name: string
  vicinity: string
  rating?: number
  user_ratings_total?: number
  types: string[]
  geometry: {
    location: { lat: number; lng: number }
  }
}

export interface PlaceDetails {
  place_id: string
  name: string
  rating?: number
  user_ratings_total?: number
  types: string[]
  formatted_address?: string
  formatted_phone_number?: string
}

export class PlacesClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async nearbySearch(params: {
    lat: number
    lng: number
    specialty: string | null | undefined
    gbpCategory?: string | null
    radiusMeters?: number
  }): Promise<PlaceResult[]> {
    const { lat, lng, specialty, gbpCategory, radiusMeters = 5000 } = params
    const ctx = getEngineContext(specialty)
    // Se a specialty é conhecida no vocab, usa os campos do vocab.
    // Se não, usa a categoria GBP diretamente como keyword (sem fallback para 'health').
    const type = ctx.placesSearchType
    const keyword = ctx.placesSearchKeyword !== 'negócio local' && ctx.placesSearchKeyword
      ? ctx.placesSearchKeyword
      : (gbpCategory ?? ctx.placesSearchKeyword)

    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
    url.searchParams.set('location', `${lat},${lng}`)
    url.searchParams.set('radius', String(radiusMeters))
    url.searchParams.set('type', type)
    url.searchParams.set('keyword', keyword)
    url.searchParams.set('language', 'pt-BR')
    url.searchParams.set('key', this.apiKey)

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Places API error ${res.status}`)

    const data = await res.json() as { status: string; results: PlaceResult[] }
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API status: ${data.status}`)
    }

    return data.results ?? []
  }

  async getDetails(placeId: string): Promise<PlaceDetails | null> {
    const fields = 'place_id,name,rating,user_ratings_total,types,formatted_address,formatted_phone_number'
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    url.searchParams.set('place_id', placeId)
    url.searchParams.set('fields', fields)
    url.searchParams.set('language', 'pt-BR')
    url.searchParams.set('key', this.apiKey)

    const res = await fetch(url.toString())
    if (!res.ok) return null

    const data = await res.json() as { status: string; result: PlaceDetails }
    if (data.status !== 'OK') return null

    return data.result ?? null
  }

  // Filtra a localização própria pelo nome para não incluir no benchmark
  static excludeSelf(results: PlaceResult[], ownName: string): PlaceResult[] {
    const normalized = ownName.toLowerCase().trim()
    return results.filter(r => {
      const rName = r.name.toLowerCase().trim()
      return !rName.includes(normalized) && !normalized.includes(rName)
    })
  }
}
