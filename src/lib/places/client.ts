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

// Resultado da extracao: pode ser um place_id direto ou uma query de texto
export interface ExtractedInput {
  type: 'place_id' | 'query'
  value: string
}

// Extrai place_id ou nome legivel de uma URL do Google Maps
export async function extractQueryFromUrl(input: string): Promise<string> {
  const extracted = await extractFromUrl(input)
  return extracted.value
}

export async function extractFromUrl(input: string): Promise<ExtractedInput> {
  let url = input.trim()

  if (isShortUrl(url)) {
    url = await resolveShortUrl(url)
  }

  try {
    // Tenta extrair place_id direto da URL (formato ftid=0x...:0x...)
    const ftidMatch = url.match(/ftid=(0x[0-9a-f]+:0x[0-9a-f]+)/i)
    if (ftidMatch) {
      // ftid nao e place_id, mas podemos usar o nome do lugar
    }

    // Formato: /maps/place/Nome+do+Local/@...
    const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/)
    if (placeMatch) {
      return { type: 'query', value: decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) }
    }
    // Formato: ?q=Nome+do+Local
    const qMatch = url.match(/[?&]q=([^&]+)/)
    if (qMatch) {
      return { type: 'query', value: decodeURIComponent(qMatch[1].replace(/\+/g, ' ')) }
    }
    // Formato: /maps/search/Nome+do+Local
    const searchMatch = url.match(/\/maps\/search\/([^/@?]+)/)
    if (searchMatch) {
      return { type: 'query', value: decodeURIComponent(searchMatch[1].replace(/\+/g, ' ')) }
    }
  } catch {
    // ignora erros de parsing
  }

  // Se nao e URL reconhecivel, usa o input direto como query de busca
  return { type: 'query', value: input }
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
