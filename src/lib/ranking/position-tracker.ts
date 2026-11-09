// Motor de Ranking: Camada 1 - Position Tracking
// Busca a posicao do usuario nos resultados do Google para cada keyword.
// Usa Google Places textSearch (API antiga, funcional) com coordenadas.

import { searchPlace, getPlaceDetails } from '@/lib/places/client'

interface PositionResult {
  keyword: string
  position: number | null // 1-based, null se nao apareceu
  totalResults: number
  topCompetitor: { name: string; reviews: number } | null
}

/**
 * Busca a posicao do negocio nos resultados do Google para uma keyword.
 * Retorna a posicao (1 = primeiro) ou null se nao apareceu nos top 20.
 */
export async function trackPosition(
  keyword: string,
  businessName: string,
  lat: number | null,
  lng: number | null
): Promise<PositionResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return { keyword, position: null, totalResults: 0, topCompetitor: null }
  }

  // textSearch retorna ate 20 resultados ordenados por relevancia
  const locationParam = lat && lng ? `&location=${lat},${lng}&radius=5000` : ''
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&language=pt-BR${locationParam}&key=${apiKey}`

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) {
    return { keyword, position: null, totalResults: 0, topCompetitor: null }
  }

  const data = await res.json() as {
    status: string
    results: Array<{
      place_id: string
      name: string
      user_ratings_total?: number
    }>
  }

  if (data.status !== 'OK' || !data.results?.length) {
    return { keyword, position: null, totalResults: 0, topCompetitor: null }
  }

  const results = data.results

  // Matching fuzzy: extrai palavras significativas do nome (ignora conectores)
  const stopWords = new Set(['e', 'de', 'do', 'da', 'em', 'no', 'na', 'a', 'o', '|', '&', '-', ','])
  const extractWords = (name: string) =>
    name.toLowerCase().replace(/[|&\-,]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))

  const businessWords = extractWords(businessName)

  function isMatch(resultName: string): boolean {
    const resultWords = extractWords(resultName)
    // Match se pelo menos 2 palavras significativas coincidem
    const matchCount = businessWords.filter(w => resultWords.some(rw => rw.includes(w) || w.includes(rw))).length
    return matchCount >= 2
  }

  // Encontrar posicao do negocio nos resultados
  let position: number | null = null
  for (let i = 0; i < results.length; i++) {
    if (isMatch(results[i].name)) {
      position = i + 1
      break
    }
  }

  // Top competitor (primeiro resultado que nao e o proprio negocio)
  let topCompetitor: { name: string; reviews: number } | null = null
  for (const r of results) {
    if (!isMatch(r.name)) {
      topCompetitor = {
        name: r.name,
        reviews: r.user_ratings_total ?? 0,
      }
      break
    }
  }

  return {
    keyword,
    position,
    totalResults: results.length,
    topCompetitor,
  }
}
