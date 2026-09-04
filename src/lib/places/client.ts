// =============================================================================
// DESTAKA - Google Places API Client (public diagnostic)
// Usado pela ferramenta /verificar: sem OAuth, chave de API publica
// =============================================================================

import https from 'https'
import http from 'http'

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

interface FindPlaceResponse {
  candidates: Array<{ place_id: string; name: string; formatted_address: string }>
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

// =============================================================================
// SHORT URL RESOLUTION - usa Node.js nativo (mais confiavel que fetch em serverless)
// =============================================================================

// IMPORTANTE: Google retorna 302 redirect para User-Agent simples (curl),
// mas retorna HTML+JS para User-Agent de browser. Usar UA simples.
function followRedirects(url: string, maxRedirects = 10): Promise<string> {
  return new Promise((resolve) => {
    let remaining = maxRedirects

    function follow(currentUrl: string) {
      if (remaining <= 0) {
        resolve(currentUrl)
        return
      }
      remaining--

      const mod = currentUrl.startsWith('https') ? https : http

      const req = mod.get(currentUrl, {
        headers: {
          'User-Agent': 'curl/8.0',
          'Accept': '*/*',
        },
        timeout: 8000,
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, currentUrl).href
          res.resume()
          // Se ja chegou numa URL do Google Maps, para
          if (next.includes('/maps/place/') || next.includes('/maps/search/')) {
            resolve(next)
            return
          }
          follow(next)
          return
        }

        res.resume()
        resolve(currentUrl)
      })

      req.on('error', () => resolve(currentUrl))
      req.on('timeout', () => { req.destroy(); resolve(currentUrl) })
    }

    follow(url)
  })
}

// =============================================================================
// URL PARSING - extrai query e coordenadas de URLs do Google Maps
// =============================================================================

interface ParsedMapsInput {
  query: string
  lat: number | null
  lng: number | null
  resolvedUrl: string
}

function isShortUrl(input: string): boolean {
  return (
    input.includes('maps.app.goo.gl') ||
    input.includes('goo.gl/maps') ||
    input.includes('share.google')
  )
}

function parseGoogleMapsUrl(url: string, originalInput: string): ParsedMapsInput {
  let query = originalInput
  let lat: number | null = null
  let lng: number | null = null

  try {
    // Coordenadas precisas do lugar (!3d=lat !4d=lng)
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

    // Nome do lugar: /maps/place/Nome+do+Local/@...
    const placeMatch = url.match(/\/maps\/place\/([^/@?]+)/)
    if (placeMatch) {
      query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
      return { query, lat, lng, resolvedUrl: url }
    }

    // ?q=Nome
    const qMatch = url.match(/[?&]q=([^&]+)/)
    if (qMatch) {
      query = decodeURIComponent(qMatch[1].replace(/\+/g, ' '))
      return { query, lat, lng, resolvedUrl: url }
    }

    // /maps/search/Nome
    const searchMatch = url.match(/\/maps\/search\/([^/@?]+)/)
    if (searchMatch) {
      query = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '))
      return { query, lat, lng, resolvedUrl: url }
    }
  } catch {
    // ignora erros de parsing
  }

  return { query, lat, lng, resolvedUrl: url }
}

// =============================================================================
// PUBLIC API - funcoes exportadas
// =============================================================================

// Resolve input (short URL ou URL completa) e extrai query + coordenadas
export async function resolveInput(input: string): Promise<ParsedMapsInput> {
  let url = input.trim()

  if (isShortUrl(url)) {
    console.log('[places] Resolving short URL:', url)
    url = await followRedirects(url)
    console.log('[places] Resolved to:', url)
  }

  return parseGoogleMapsUrl(url, input)
}

// Compat: mantém a interface antiga
export async function extractQueryFromUrl(input: string): Promise<string> {
  const parsed = await resolveInput(input)
  return parsed.query
}

// Busca place_id usando coordenadas quando disponíveis
export async function searchPlace(query: string, lat?: number | null, lng?: number | null): Promise<string | null> {
  if (!API_KEY) return null

  console.log('[places] searchPlace:', { query, lat, lng })

  // Se temos coordenadas, usa Find Place From Text (mais preciso)
  if (lat != null && lng != null) {
    const findUrl = `${PLACES_BASE}/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&locationbias=circle:2000@${lat},${lng}&fields=place_id,name,formatted_address&language=pt-BR&key=${API_KEY}`
    const findRes = await fetch(findUrl)
    const findData = await findRes.json() as FindPlaceResponse

    console.log('[places] findPlace result:', findData.status, findData.candidates?.length)

    if (findData.status === 'OK' && findData.candidates?.length) {
      return findData.candidates[0].place_id
    }

    // Fallback: Text Search com location bias
    const tsUrl = `${PLACES_BASE}/textsearch/json?query=${encodeURIComponent(query)}&language=pt-BR&location=${lat},${lng}&radius=5000&key=${API_KEY}`
    const tsRes = await fetch(tsUrl)
    const tsData = await tsRes.json() as TextSearchResponse

    console.log('[places] textSearch (biased) result:', tsData.status, tsData.results?.length)

    if (tsData.status === 'OK' && tsData.results?.length) {
      return tsData.results[0].place_id
    }
  }

  // Sem coordenadas: Text Search global
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
