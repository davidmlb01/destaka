// =============================================================================
// DESTAKA — Competitor Intelligence (Story 03)
// Discovery via Places API + benchmark via Claude
// =============================================================================

import { searchPlace, getPlaceDetails } from '@/lib/places/client'
import { getAnthropic, AI_MODEL } from '@/lib/ai'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface Competitor {
  id: string
  profile_id: string
  place_id: string
  name: string
  avg_rating: number | null
  review_count: number
  address: string | null
  photo_count: number
  categories: string[]
  has_website: boolean
  benchmark_data: BenchmarkData | null
  last_tracked_at: string
}

export interface BenchmarkData {
  summary: string
  strengths: string[]
  gaps: string[]
  alerts: string[]
  generated_at: string
}

// Extrai cidade do endereço formatado: "Rua X, 10 - Bairro, Cidade - UF"
function extractCity(address: string): string {
  const parts = address.split(',')
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 1].trim().split('-')[0].trim()
    return cityPart || address
  }
  return address
}

// Constrói query de busca para concorrentes
function buildCompetitorQuery(category: string, address: string): string {
  const city = extractCity(address)
  const categoryMap: Record<string, string> = {
    dentist: 'dentista',
    physiotherapist: 'fisioterapeuta',
    psychologist: 'psicologo',
    nutritionist: 'nutricionista',
    doctor: 'medico',
  }
  const localCategory = categoryMap[category.toLowerCase()] ?? category
  return `${localCategory} ${city}`
}

// Descobre os top 3 concorrentes e salva no banco
export async function discoverCompetitors(
  db: SupabaseClient,
  profileId: string
): Promise<{ discovered: number; errors: string[] }> {
  const errors: string[] = []

  const { data: profile, error: profileError } = await db
    .from('gmb_profiles')
    .select('id, name, address, category, google_location_id')
    .eq('id', profileId)
    .single()

  if (profileError || !profile) {
    return { discovered: 0, errors: ['Perfil nao encontrado'] }
  }

  const query = buildCompetitorQuery(profile.category ?? 'saude', profile.address ?? '')
  const results: Array<{ placeId: string; details: Awaited<ReturnType<typeof getPlaceDetails>> }> = []

  // Busca por texto: retorna varios resultados, pegamos os primeiros 5 para filtrar
  const searches = [
    query,
    `${query} consultorio`,
    `clinica ${query}`,
  ]

  const placeIds = new Set<string>()

  for (const q of searches) {
    if (placeIds.size >= 5) break
    const placeId = await searchPlace(q)
    if (placeId && !placeIds.has(placeId)) {
      placeIds.add(placeId)
    }
  }

  for (const placeId of Array.from(placeIds).slice(0, 5)) {
    if (results.length >= 3) break
    // Ignora o proprio perfil
    if (profile.google_location_id && placeId === profile.google_location_id) continue

    const details = await getPlaceDetails(placeId)
    if (details) results.push({ placeId, details })
  }

  let discovered = 0

  for (const { placeId, details } of results.slice(0, 3)) {
    if (!details) continue

    const { error: upsertError } = await db
      .from('competitors')
      .upsert(
        {
          profile_id: profileId,
          place_id: placeId,
          name: details.name,
          avg_rating: details.rating,
          review_count: details.user_ratings_total ?? 0,
          address: details.formatted_address,
          photo_count: details.photos?.length ?? 0,
          categories: details.types ?? [],
          has_website: !!details.website,
          last_tracked_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,place_id' }
      )

    if (upsertError) {
      errors.push(`Erro ao salvar ${details.name}: ${upsertError.message}`)
    } else {
      discovered++
    }
  }

  return { discovered, errors }
}

// Atualiza dados dos concorrentes existentes (cron semanal)
export async function refreshCompetitors(
  db: SupabaseClient,
  profileId: string
): Promise<{ refreshed: number; errors: string[] }> {
  const errors: string[] = []

  const { data: competitors, error } = await db
    .from('competitors')
    .select('id, place_id, name')
    .eq('profile_id', profileId)

  if (error || !competitors?.length) return { refreshed: 0, errors: [] }

  let refreshed = 0

  for (const comp of competitors) {
    const details = await getPlaceDetails(comp.place_id)
    if (!details) continue

    const { error: updateError } = await db
      .from('competitors')
      .update({
        name: details.name,
        avg_rating: details.rating,
        review_count: details.user_ratings_total ?? 0,
        photo_count: details.photos?.length ?? 0,
        has_website: !!details.website,
        last_tracked_at: new Date().toISOString(),
      })
      .eq('id', comp.id)

    if (updateError) {
      errors.push(`Erro ao atualizar ${comp.name}: ${updateError.message}`)
    } else {
      refreshed++
    }
  }

  return { refreshed, errors }
}

// Gera benchmark via Claude e salva em cada concorrente
export async function generateBenchmark(
  db: SupabaseClient,
  profileId: string
): Promise<void> {
  const { data: profile } = await db
    .from('gmb_profiles')
    .select('name, category, avg_rating, review_count')
    .eq('id', profileId)
    .single()

  const { data: competitors } = await db
    .from('competitors')
    .select('id, name, avg_rating, review_count, photo_count, has_website, categories')
    .eq('profile_id', profileId)

  if (!profile || !competitors?.length) return

  const anthropic = getAnthropic()

  for (const comp of competitors) {
    const ratingDiff = (profile.avg_rating ?? 0) - (comp.avg_rating ?? 0)
    const reviewDiff = (profile.review_count ?? 0) - (comp.review_count ?? 0)

    const prompt = `Voce e um especialista em SEO local e marketing para profissionais de saude.

Analise a comparacao entre um profissional de saude e um concorrente no Google Business Profile.

PROFISSIONAL (cliente Destaka):
- Nome: ${profile.name}
- Categoria: ${profile.category}
- Nota media: ${profile.avg_rating ?? 'nao disponivel'}
- Total de avaliacoes: ${profile.review_count ?? 0}

CONCORRENTE:
- Nome: ${comp.name}
- Nota media: ${comp.avg_rating ?? 'nao disponivel'}
- Total de avaliacoes: ${comp.review_count ?? 0}
- Numero de fotos: ${comp.photo_count}
- Tem website: ${comp.has_website ? 'sim' : 'nao'}
- Categorias: ${comp.categories.slice(0, 3).join(', ')}

DIFERENCAS:
- Nota: ${ratingDiff > 0 ? `nosso cliente e ${ratingDiff.toFixed(1)} estrelas ACIMA` : ratingDiff < 0 ? `concorrente e ${Math.abs(ratingDiff).toFixed(1)} estrelas acima` : 'notas iguais'}
- Avaliacoes: ${reviewDiff > 0 ? `nosso cliente tem ${reviewDiff} avaliacoes a mais` : reviewDiff < 0 ? `concorrente tem ${Math.abs(reviewDiff)} avaliacoes a mais` : 'volumes iguais'}

Responda em JSON com este formato exato:
{
  "summary": "frase curta de 1-2 linhas resumindo o posicionamento do concorrente",
  "strengths": ["ponto forte 1 do concorrente", "ponto forte 2"],
  "gaps": ["oportunidade que o concorrente nao aproveita 1", "oportunidade 2"],
  "alerts": ["alerta se o concorrente esta claramente na frente em algo importante"]
}

Maximo 2 itens em cada array. Portugues, sem usar travessao (use virgula ou dois-pontos no lugar).`

    try {
      const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) continue

      const parsed = JSON.parse(jsonMatch[0]) as Omit<BenchmarkData, 'generated_at'>
      const benchmarkData: BenchmarkData = { ...parsed, generated_at: new Date().toISOString() }

      await db
        .from('competitors')
        .update({ benchmark_data: benchmarkData })
        .eq('id', comp.id)
    } catch (err) {
      console.error(`[competitors] benchmark error for ${comp.name}:`, err)
    }
  }
}
