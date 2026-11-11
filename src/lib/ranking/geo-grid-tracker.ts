// Geo-Grid Rank Tracker
// Verifica posição do negócio em múltiplos pontos (grid NxN) ao redor do endereço
// Resultado: mapa de calor mostrando onde é forte, médio, fraco ou invisível

const MIN_REVIEWS_RELEVANT = 100

interface GridPoint {
  lat: number
  lng: number
  position: number | null
  totalRelevant: number
  topCompetitor: string | null
}

export interface GeoGridResult {
  center: { lat: number; lng: number }
  radiusKm: number
  gridSize: number
  keyword: string
  points: GridPoint[]
  summary: {
    strong: number   // top 3
    medium: number   // 4-10
    weak: number     // 11+
    invisible: number // não aparece
  }
}

/**
 * Gera grid NxN de pontos equidistantes ao redor de um centro
 */
function generateGrid(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
  gridSize: number
): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = []

  // 1 grau lat ≈ 111km, 1 grau lng ≈ 111km * cos(lat)
  const latDeg = radiusKm / 111
  const lngDeg = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180))

  const step = 2 / (gridSize - 1) // -1 to +1 in gridSize steps

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const latOffset = (-1 + row * step) * latDeg
      const lngOffset = (-1 + col * step) * lngDeg
      points.push({
        lat: centerLat + latOffset,
        lng: centerLng + lngOffset,
      })
    }
  }

  return points
}

/**
 * Busca posição do negócio em um ponto específico
 */
async function checkPositionAtPoint(
  lat: number,
  lng: number,
  keyword: string,
  businessName: string,
  apiKey: string
): Promise<GridPoint> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&language=pt-BR&location=${lat},${lng}&radius=5000&key=${apiKey}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) {
      return { lat, lng, position: null, totalRelevant: 0, topCompetitor: null }
    }

    const data = await res.json() as {
      status: string
      results: Array<{ name: string; user_ratings_total?: number }>
    }

    if (data.status !== 'OK' || !data.results?.length) {
      return { lat, lng, position: null, totalRelevant: 0, topCompetitor: null }
    }

    // Filtrar só relevantes (100+ reviews) + o próprio negócio
    const stopWords = new Set(['e', 'de', 'do', 'da', 'em', 'no', 'na', 'a', 'o', '|', '&', '-', ','])
    const extractWords = (name: string) =>
      name.toLowerCase().replace(/[|&\-,]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))

    const businessWords = extractWords(businessName)
    const isMatch = (name: string) => {
      const words = extractWords(name)
      return businessWords.filter(w => words.some(rw => rw.includes(w) || w.includes(rw))).length >= 2
    }

    const relevant = data.results.filter(r =>
      (r.user_ratings_total ?? 0) >= MIN_REVIEWS_RELEVANT || isMatch(r.name)
    )

    let position: number | null = null
    for (let i = 0; i < relevant.length; i++) {
      if (isMatch(relevant[i].name)) {
        position = i + 1
        break
      }
    }

    const topComp = relevant.find(r => !isMatch(r.name))

    return {
      lat,
      lng,
      position,
      totalRelevant: relevant.length,
      topCompetitor: topComp?.name ?? null,
    }
  } catch {
    return { lat, lng, position: null, totalRelevant: 0, topCompetitor: null }
  }
}

/**
 * Executa tracking em grid completo
 */
export async function trackGeoGrid(params: {
  centerLat: number
  centerLng: number
  radiusKm?: number
  gridSize?: number
  keyword: string
  businessName: string
}): Promise<GeoGridResult> {
  const { centerLat, centerLng, radiusKm = 3, gridSize = 4, keyword, businessName } = params

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return {
      center: { lat: centerLat, lng: centerLng },
      radiusKm, gridSize, keyword,
      points: [],
      summary: { strong: 0, medium: 0, weak: 0, invisible: 0 },
    }
  }

  const gridPoints = generateGrid(centerLat, centerLng, radiusKm, gridSize)

  // Executar sequencialmente para respeitar rate limits
  const results: GridPoint[] = []
  for (const point of gridPoints) {
    const result = await checkPositionAtPoint(point.lat, point.lng, keyword, businessName, apiKey)
    results.push(result)
    // Small delay between requests
    await new Promise(r => setTimeout(r, 200))
  }

  const summary = {
    strong: results.filter(p => p.position !== null && p.position <= 3).length,
    medium: results.filter(p => p.position !== null && p.position > 3 && p.position <= 10).length,
    weak: results.filter(p => p.position !== null && p.position > 10).length,
    invisible: results.filter(p => p.position === null).length,
  }

  return {
    center: { lat: centerLat, lng: centerLng },
    radiusKm, gridSize, keyword,
    points: results,
    summary,
  }
}
