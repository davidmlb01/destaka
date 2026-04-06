// =============================================================================
// DESTAKA — Google Places API Client (public diagnostic)
// Usado pela ferramenta /verificar: sem OAuth, chave de API pública
// =============================================================================

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place'

export interface PlaceDetails {
  name: string
  formatted_address: string
  formatted_phone_number: string | null
  website: string | null
  rating: number | null
  user_ratings_total: number | null
  opening_hours: { weekday_text: string[] } | null
  photos: Array<{ photo_reference: string }> | null
  types: string[]
  business_status: string | null
  place_id: string
}

interface TextSearchResponse {
  results: Array<{ place_id: string; name: string; formatted_address: string }>
  status: string
}

interface DetailsResponse {
  result: PlaceDetails
  status: string
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY

export function isPlacesAvailable(): boolean {
  return !!API_KEY
}

// Extrai nome legível de uma URL do Google Maps
export function extractQueryFromUrl(input: string): string {
  try {
    // Formato: /maps/place/Nome+do+Local/@...
    const placeMatch = input.match(/\/maps\/place\/([^/@]+)/)
    if (placeMatch) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
    }
  } catch {
    // ignora erros de parsing
  }
  // Se não é URL, usa o input direto como query de busca
  return input
}

export async function searchPlace(query: string): Promise<string | null> {
  if (!API_KEY) return null

  const url = `${PLACES_BASE}/textsearch/json?query=${encodeURIComponent(query)}&language=pt-BR&key=${API_KEY}`
  const res = await fetch(url)
  const data = await res.json() as TextSearchResponse

  if (data.status !== 'OK' || !data.results.length) return null
  return data.results[0].place_id
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!API_KEY) return null

  const fields = [
    'name', 'formatted_address', 'formatted_phone_number',
    'website', 'rating', 'user_ratings_total', 'opening_hours',
    'photos', 'types', 'business_status', 'place_id',
  ].join(',')

  const url = `${PLACES_BASE}/details/json?place_id=${placeId}&fields=${fields}&language=pt-BR&key=${API_KEY}`
  const res = await fetch(url)
  const data = await res.json() as DetailsResponse

  if (data.status !== 'OK') return null
  return data.result
}
