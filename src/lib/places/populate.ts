// Popula tabelas do dashboard usando Google Places API (public key)
// Alternativa ao Business Profile API enquanto aprovacao nao sai
// Pode ser chamado fire-and-forget (auth callback) ou sincrono (API route)

import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { isPlacesAvailable, searchPlace, getPlaceDetails } from './client'
import { placeDetailsToProfileData } from './scorer'
import { buildScoreInput, calculateScore } from '@/lib/score/score-calculator'
import type { PlaceDetails } from './client'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface PopulateResult {
  status: 'populated' | 'skipped' | 'error'
  place?: { name: string; address: string; rating: number | null; reviewsTotal: number | null }
  score?: { total: number; faixa: string }
  error?: string
}

/**
 * Busca dados do Google Places API e popula gbp_profiles + scores para a org.
 * Seguro para chamar repetidamente: faz upsert com onConflict.
 * Retorna sem erro se ja tem dados ou se Places API nao esta configurada.
 */
export async function populateFromPlaces(orgId: string): Promise<PopulateResult> {
  if (!isPlacesAvailable()) {
    return { status: 'skipped', error: 'Places API nao configurada' }
  }

  const db = admin()

  // Verifica se ja tem score (evita chamadas desnecessarias ao Google)
  const { data: existingScore } = await db
    .from('scores')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1)
    .single()

  if (existingScore) {
    return { status: 'skipped' }
  }

  // Busca nome da org
  const { data: org } = await db
    .from('organizations')
    .select('name, specialty')
    .eq('id', orgId)
    .single()

  if (!org?.name) {
    return { status: 'error', error: 'Organizacao sem nome' }
  }

  // Pesquisa no Google Places
  const placeId = await searchPlace(org.name)
  if (!placeId) {
    return { status: 'error', error: `"${org.name}" nao encontrado no Google Maps` }
  }

  const placeDetails = await getPlaceDetails(placeId)
  if (!placeDetails) {
    return { status: 'error', error: 'Falha ao obter detalhes do Places API' }
  }

  // Popula as tabelas
  await persistProfileData(db, orgId, placeDetails)
  const scoreResult = await persistScoreData(db, orgId, placeDetails)

  return {
    status: 'populated',
    place: {
      name: placeDetails.name,
      address: placeDetails.formatted_address,
      rating: placeDetails.rating,
      reviewsTotal: placeDetails.user_ratings_total,
    },
    score: scoreResult,
  }
}

async function persistProfileData(
  db: ReturnType<typeof admin>,
  orgId: string,
  place: PlaceDetails,
) {
  const photoCount = place.photos?.length ?? 0
  const categories = place.types
    .filter(t => t !== 'point_of_interest' && t !== 'establishment')
    .slice(0, 5)

  const profilePayload = {
    organization_id: orgId,
    location_id: place.place_id,
    name: place.name,
    categories,
    attributes: [],
    services: [],
    description: null as string | null,
    phone: place.formatted_phone_number ?? null,
    address: place.formatted_address
      ? { formattedAddress: place.formatted_address }
      : null,
    hours: place.opening_hours?.weekday_text
      ? { periods: place.opening_hours.weekday_text }
      : null,
    photo_count: photoCount,
    last_synced_at: new Date().toISOString(),
    audit_report: buildAuditReport(place),
  }

  await db
    .from('gbp_profiles')
    .upsert(profilePayload, { onConflict: 'organization_id,location_id' })

  // Atualiza gbp_location_id na organizacao
  await db
    .from('organizations')
    .update({ gbp_location_id: place.place_id })
    .eq('id', orgId)
}

async function persistScoreData(
  db: ReturnType<typeof admin>,
  orgId: string,
  place: PlaceDetails,
): Promise<{ total: number; faixa: string }> {
  const photoCount = place.photos?.length ?? 0
  const categories = place.types
    .filter(t => t !== 'point_of_interest' && t !== 'establishment')
    .slice(0, 5)

  const scoreInput = buildScoreInput({
    profile: {
      description: null,
      categories,
      attributes: [],
      photo_count: photoCount,
      hours: place.opening_hours ?? null,
    },
    reviewCount: place.user_ratings_total ?? 0,
    avgRating: place.rating ?? 0,
    responseRate: 0,
    reviewsLast30Days: 0,
    recentPostCount: 0,
  })

  const breakdown = calculateScore(scoreInput, [])
  const snapshotDate = new Date().toISOString().split('T')[0]

  await db.from('scores').upsert({
    organization_id: orgId,
    total: breakdown.total,
    gmb_completude: breakdown.gmb_completude,
    reputacao: breakdown.reputacao,
    visibilidade: breakdown.visibilidade,
    retencao: breakdown.retencao,
    conversao: breakdown.conversao,
    faixa: breakdown.faixa,
    tendencia: breakdown.tendencia,
    snapshot_date: snapshotDate,
  }, { onConflict: 'organization_id,snapshot_date' })

  return { total: breakdown.total, faixa: breakdown.faixa }
}

function buildAuditReport(place: PlaceDetails) {
  type Gap = { field: string; severity: string; message: string }
  const gaps: Gap[] = []

  if (!place.formatted_phone_number) {
    gaps.push({ field: 'phone', severity: 'critical', message: 'Telefone nao cadastrado no perfil' })
  }
  if (!place.website) {
    gaps.push({ field: 'website', severity: 'warning', message: 'Website nao vinculado ao perfil' })
  }
  if (!place.opening_hours) {
    gaps.push({ field: 'hours', severity: 'warning', message: 'Horario de funcionamento nao definido' })
  }
  if ((place.photos?.length ?? 0) < 5) {
    gaps.push({
      field: 'photos',
      severity: 'warning',
      message: `Apenas ${place.photos?.length ?? 0} fotos. Ideal: 5 ou mais`,
    })
  }
  if ((place.user_ratings_total ?? 0) < 10) {
    gaps.push({
      field: 'reviews',
      severity: 'critical',
      message: `Apenas ${place.user_ratings_total ?? 0} avaliacoes. Ideal: 10 ou mais`,
    })
  }
  if ((place.rating ?? 0) < 4.0) {
    gaps.push({
      field: 'rating',
      severity: 'critical',
      message: `Nota media ${place.rating?.toFixed(1) ?? '0'}. Meta: 4.0 ou mais`,
    })
  }

  return {
    gaps,
    summary: gaps.length === 0
      ? 'Perfil completo, sem lacunas identificadas.'
      : `${gaps.length} ${gaps.length === 1 ? 'lacuna identificada' : 'lacunas identificadas'} no perfil.`,
    source: 'places_api',
    generated_at: new Date().toISOString(),
  }
}
