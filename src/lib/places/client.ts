// =============================================================================
// DESTAKA - Google Places API Client (public diagnostic)
// Usado pela ferramenta /verificar: sem OAuth, chave de API publica
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

// Detecta se e uma URL curta ou de compartilhamento do Google Maps
function isShortUrl(input: string): boolean {
  return (
    input.includes('maps.app.goo.gl') ||
    input.includes('goo.gl/maps') ||
    input.includes('share.google')
  )
}

// Resolve URL curta seguindo redirects manualmente (mais confiavel em serverless)
async function resolveShortUrl(input: string): Promise<string> {
  let url = input
  const maxRedirects = 5
  for (let i = 0; i < maxRedirects; i++) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'manual' })
      const location = res.headers.get('location')
      if (location && (res.status === 301 || res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308)) {
        url = location.startsWith('http') ? location : new URL(location, url).href
        continue
      }
      return url
    } catch {
      return url
    }
  }
  return url
}

// Resultado da extracao de URL do Google Maps
interface ParsedMapsUrl {
  query: string
  lat: number | null
  lng: number | null
}

// Extrai nome e coordenadas de uma URL do Google Maps
export async function extractQueryFromUrl(input: string): Promise<string> {
  const parsed = await parseMapsUrl(input)
  return parsed.query
}

async function parseMapsUrl(input: string): Promise<ParsedMapsUrl> {
  let url = input.trim()

  if (isShortUrl(url)) {
    url = await resolveShortUrl(url)
  }

  let query = input
  let lat: number | null = null
  let lng: number | null = null

  try {
    // Extrai coordenadas precisas do lugar (!3d=lat !4d=lng no data param)
    const lat3d = url.match(/!3d(-?[\d.]+)/)
    const lng4d = url.match(/!4d(-?[\d.]+)/)
    if (lat3d && lng4d) {
      lat = parseFloat(lat3d[1])
      lng = parseFloat(lng4d[1])
    }

    // Fallback: coordenadas do viewport (@lat,lng)
    if (lat === null) {
      const atMatch = url.match(/@(-?[\d.]+),(-?[\d.]+)/)
      if (atMatch) {
        lat = parseFloat(atMatch[1])
        lng = parseFloat(atMatch[2])
      }
    }

    // Formato: /maps/place/Nome+do+Local/@...
    const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/)
    if (placeMatch) {
      query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
      return { query, lat, lng }
    }
    // Formato: ?q=Nome+do+Local
    const qMatch = url.match(/[?&]q=([^&]+)/)
    if (qMatch) {
      query = decodeURIComponent(qMatch[1].replace(/\+/g, ' '))
      return { query, lat, lng }
    }
    // Formato: /maps/search/Nome+do+Local
    const searchMatch = url.match(/\/maps\/search\/([^/@?]+)/)
    if (searchMatch) {
      query = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '))
      return { query, lat, lng }
    }
  } catch {
    // ignora erros de parsing
  }

  return { query, lat, lng }
}

// searchPlace agora recebe input original para extrair coordenadas como bias
export async function searchPlace(query: string, input?: string): Promise<string | null> {
  if (!API_KEY) return null

  // Tenta extrair coordenadas do input original (URL) para location bias
  let locationParam = ''
  if (input) {
    const parsed = await parseMapsUrl(input)
    if (parsed.lat !== null && parsed.lng !== null) {
      locationParam = `&location=${parsed.lat},${parsed.lng}&radius=5000`
    }
  }

  const url = `${PLACES_BASE}/textsearch/json?query=${encodeURIComponent(query)}&language=pt-BR${locationParam}&key=${API_KEY}`
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
