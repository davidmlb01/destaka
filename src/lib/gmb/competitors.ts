// =============================================================================
// DESTAKA — Competitor Intelligence (Story 03)
// Discovery via Places API + benchmark via Claude
// =============================================================================

import { searchPlace, getPlaceDetails } from '@/lib/places/client'
import { getAnthropic, AI_MODEL } from '@/lib/ai'
import { sanitizeForPrompt } from '@/lib/sanitize'
import { extractReviewKeywords } from './competitive-analyzer'
import { getEngineContext } from '@/lib/vertical-vocab'
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
  description: string | null
  review_keywords: string[]
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

// Extrai bairro do endereço formatado: "Av. X, 1066 - Sl 910 - Copacabana, Rio de Janeiro - RJ"
function extractNeighborhood(address: string): string {
  // Formato comum: "Rua X, N - Complemento - Bairro, Cidade - UF"
  const parts = address.split(',')
  if (parts.length >= 2) {
    // Penultima parte geralmente tem "Bairro" ou "Complemento - Bairro"
    const beforeCity = parts[parts.length - 2].trim()
    // Se tem hifen, o ultimo segmento e o bairro
    const segments = beforeCity.split('-').map(s => s.trim())
    const bairro = segments[segments.length - 1]
    if (bairro && bairro.length > 2) return bairro
  }
  // Fallback: cidade
  const cityPart = parts[parts.length - 1]?.trim().split('-')[0].trim()
  return cityPart || address
}

// Infere termo de busca do nome do negocio quando category e null
function inferSearchTermFromName(name: string): string {
  const lower = name.toLowerCase()
  const termMap: Array<[string, string]> = [
    ['quiropraxia', 'quiropraxia'],
    ['quiroprat', 'quiropraxia'],
    ['osteopatia', 'osteopatia'],
    ['fisioterapia', 'fisioterapia'],
    ['pilates', 'pilates'],
    ['acupuntura', 'acupuntura'],
    ['dentist', 'dentista'],
    ['odonto', 'odontologia'],
    ['psicolog', 'psicologia'],
    ['nutri', 'nutricionista'],
    ['dermatolog', 'dermatologia'],
    ['pediatr', 'pediatria'],
    ['ortoped', 'ortopedia'],
    ['advocac', 'advocacia'],
    ['advogad', 'advogado'],
    ['contab', 'contabilidade'],
    ['imobili', 'imobiliária'],
    ['veterin', 'veterinário'],
    ['academia', 'academia'],
    ['salao', 'salão de beleza'],
    ['restauran', 'restaurante'],
    ['oficina', 'oficina mecânica'],
    ['floricultur', 'floricultura'],
    ['fotograf', 'fotógrafo'],
    ['marketing', 'agência de marketing'],
    ['tecnolog', 'empresa de tecnologia'],
  ]
  for (const [pattern, term] of termMap) {
    if (lower.includes(pattern)) return term
  }
  // Sem reconhecimento: retorna o nome como termo (melhor que 'saude' para verticais desconhecidas)
  return name
}

// Constroi query de busca para concorrentes
function buildCompetitorQuery(
  category: string | null,
  address: string,
  name: string,
  specialty: string | null = null
): string {
  const neighborhood = extractNeighborhood(address)

  // Prioridade 1: specialty mapeada no vocab (via getEngineContext)
  if (specialty) {
    const ctx = getEngineContext(specialty)
    // Se a keyword não é o genérico 'negócio local', usa ela
    if (ctx.placesSearchKeyword !== 'negócio local') {
      return `${ctx.placesSearchKeyword} ${neighborhood}`
    }
  }

  // Prioridade 2: categoria do GBP (texto livre do Google)
  if (category) {
    const categoryMap: Record<string, string> = {
      dentist: 'dentista',
      physiotherapist: 'fisioterapeuta',
      chiropractor: 'quiropraxia',
      psychologist: 'psicólogo',
      nutritionist: 'nutricionista',
      doctor: 'médico',
      lawyer: 'advogado',
      accounting: 'contabilidade',
      real_estate_agency: 'imobiliária',
      veterinary_care: 'veterinário',
      gym: 'academia',
      beauty_salon: 'salão de beleza',
      restaurant: 'restaurante',
      car_repair: 'oficina mecânica',
      florist: 'floricultura',
      photographer: 'fotógrafo',
      marketing_agency: 'agência de marketing',
      school: 'escola',
      software_company: 'empresa de tecnologia',
    }
    const mapped = categoryMap[category.toLowerCase()]
    return `${mapped ?? category} ${neighborhood}`
  }

  // Prioridade 3: inferência pelo nome do negócio (sem fallback para 'saude')
  return `${inferSearchTermFromName(name)} ${neighborhood}`
}

// Descobre os top 3 concorrentes e salva no banco
export async function discoverCompetitors(
  db: SupabaseClient,
  profileId: string
): Promise<{ discovered: number; errors: string[] }> {
  const errors: string[] = []

  const { data: profile, error: profileError } = await db
    .from('gmb_profiles')
    .select('id, name, address, category, google_location_id, latitude, longitude, organization_id')
    .eq('id', profileId)
    .single()

  if (profileError || !profile) {
    return { discovered: 0, errors: ['Perfil nao encontrado'] }
  }

  // Busca specialty da organização para usar o vocab correto
  const { data: org } = await db
    .from('organizations')
    .select('specialty')
    .eq('id', profile.organization_id)
    .single()

  const specialty = (org?.specialty as string | null) ?? null

  const query = buildCompetitorQuery(profile.category, profile.address ?? '', profile.name ?? '', specialty)
  const lat = profile.latitude as number | null
  const lng = profile.longitude as number | null
  const results: Array<{ placeId: string; details: Awaited<ReturnType<typeof getPlaceDetails>> }> = []

  // Busca por texto com coordenadas para restringir por proximidade
  // Variações genéricas (sem termos de saúde hardcoded)
  const searches = [
    query,
    `${query} perto`,
    query,
  ]

  const placeIds = new Set<string>()

  for (const q of searches) {
    if (placeIds.size >= 8) break
    const placeId = await searchPlace(q, lat, lng)
    if (placeId && !placeIds.has(placeId)) {
      placeIds.add(placeId)
    }
  }

  for (const placeId of Array.from(placeIds).slice(0, 8)) {
    if (results.length >= 5) break
    // Ignora o proprio perfil
    if (profile.google_location_id && placeId === profile.google_location_id) continue

    const details = await getPlaceDetails(placeId)
    if (details) results.push({ placeId, details })
  }

  let discovered = 0

  for (const { placeId, details } of results.slice(0, 5)) {
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
          description: null, // Places API nao retorna descricao de terceiros
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

  // Apos refresh, extrair keywords dos reviews dos concorrentes
  if (refreshed > 0) {
    await enrichCompetitorKeywords(db, profileId)
  }

  return { refreshed, errors }
}

// Enriquece concorrentes com keywords extraidos dos reviews via Places API + Claude
export async function enrichCompetitorKeywords(
  db: SupabaseClient,
  profileId: string
): Promise<void> {
  const { data: competitors } = await db
    .from('competitors')
    .select('id, place_id, name')
    .eq('profile_id', profileId)

  if (!competitors?.length) return

  // Buscar reviews de cada concorrente via Places API
  const competitorReviews: Array<{ name: string; reviews: string[] }> = []

  for (const comp of competitors) {
    const details = await getPlaceDetails(comp.place_id)
    const reviews = (details?.reviews ?? [])
      .map(r => r.text)
      .filter(Boolean)
    competitorReviews.push({ name: comp.name, reviews })
  }

  // Extrair keywords em batch via Claude
  const keywords = await extractReviewKeywords(competitorReviews)

  // Salvar keywords em cada concorrente (keywords sao do conjunto, nao individuais)
  for (const comp of competitors) {
    await db
      .from('competitors')
      .update({ review_keywords: keywords })
      .eq('id', comp.id)
  }
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
- Nome: ${sanitizeForPrompt(profile.name)}
- Categoria: ${sanitizeForPrompt(profile.category ?? '')}
- Nota media: ${profile.avg_rating ?? 'nao disponivel'}
- Total de avaliacoes: ${profile.review_count ?? 0}

CONCORRENTE:
- Nome: ${sanitizeForPrompt(comp.name)}
- Nota media: ${comp.avg_rating ?? 'nao disponivel'}
- Total de avaliacoes: ${comp.review_count ?? 0}
- Numero de fotos: ${comp.photo_count}
- Tem website: ${comp.has_website ? 'sim' : 'nao'}
- Categorias: ${comp.categories.slice(0, 3).map((c: string) => sanitizeForPrompt(c)).join(', ')}

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
