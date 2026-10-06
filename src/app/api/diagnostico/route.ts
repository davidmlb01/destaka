export const dynamic = 'force-dynamic'

// GET /api/diagnostico
// Retorna TUDO em 1 call: score, gaps, concorrentes, mapa, keywords, metricas, reviews, perfil
// Cache interno de 1 hora via Redis. Performance alvo < 2s.

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { GBPClient } from '@/lib/google/gbp-client'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { cacheGet, cacheSet } from '@/lib/redis'

const CACHE_TTL = 3600 // 1 hora

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { user, orgId, supabase } = auth

  // L1: Cache Redis
  const cacheKey = `diag:${orgId}`
  const cached = await cacheGet<Record<string, unknown>>(cacheKey)
  if (cached) {
    return privateJson(cached)
  }

  // Buscar user_id via professionals (gmb_profiles usa user_id, nao organization_id)
  const { data: prof } = await supabase
    .from('professionals')
    .select('user_id')
    .eq('organization_id', orgId)
    .maybeSingle()

  const userId = prof?.user_id ?? user.id

  // Buscar profile_id (necessario para FK de competitors)
  const { data: gbpProfileRef } = await supabase
    .from('gmb_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  const profileId = gbpProfileRef?.id ?? ''

  // Busca paralela de todos os dados necessarios
  const [
    { data: org },
    { data: latestScore },
    { data: gbpProfile },
    { data: competitors },
    { data: geoSnapshot },
    { data: keywordRows },
    { data: latestReview },
    unrepliedResult,
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('name, specialty, gbp_location_id')
      .eq('id', orgId)
      .maybeSingle(),
    supabase
      .from('scores')
      .select('total, projected_score, gmb_completude, reputacao, visibilidade, retencao, conversao, faixa, tendencia, snapshot_date')
      .eq('organization_id', orgId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('gbp_profiles')
      .select('id, name, address, google_place_id, latitude, longitude, audit_report, description, categories, photo_count')
      .eq('user_id', userId)
      .maybeSingle(),
    profileId
      ? supabase
          .from('competitors')
          .select('name, place_id, avg_rating, review_count')
          .eq('profile_id', profileId)
          .order('avg_rating', { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),
    supabase
      .from('geo_snapshots')
      .select('center_lat, center_lng, radius_km, regions, week_start')
      .eq('org_id', orgId)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('keyword_snapshots')
      .select('keyword, impressions, clicks, week_start')
      .eq('org_id', orgId)
      .order('week_start', { ascending: false })
      .order('impressions', { ascending: false })
      .limit(10),
    supabase
      .from('reviews')
      .select('author_name, rating, comment, published_at')
      .eq('organization_id', orgId)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .is('response_text', null),
  ])

  // Score e categorias
  const s = latestScore as Record<string, unknown> | null
  const scoreAtual = (s?.total as number) ?? 0
  const scoreProjetado = (s?.projected_score as number) ?? scoreAtual

  const categorias = {
    gmb_completude: { pontos: (s?.gmb_completude as number) ?? 0, max: 40, label: 'Completude GMB' },
    reputacao: { pontos: (s?.reputacao as number) ?? 0, max: 20, label: 'Reputacao' },
    alcance_geo: { pontos: (s?.retencao as number) ?? 0, max: 15, label: 'Alcance Geografico' },
    keywords: { pontos: (s?.visibilidade as number) ?? 0, max: 15, label: 'Keywords / Visibilidade' },
    conteudo: { pontos: (s?.conversao as number) ?? 0, max: 10, label: 'Conteudo / Posts' },
  }

  // Gaps do audit_report
  const auditReport = gbpProfile?.audit_report as Record<string, unknown> | null
  const gaps: Array<{ field: string; severity: string; message: string; impact: number }> = []
  if (auditReport && typeof auditReport === 'object') {
    const auditIssues = (auditReport as { issues?: Array<{ field: string; severity: string; message: string; impact: number }> }).issues
    if (Array.isArray(auditIssues)) {
      gaps.push(...auditIssues)
    }
  }

  // Concorrentes top 3
  const topConcorrentes = (competitors ?? []).map((c: {
    name: string
    place_id: string
    avg_rating: number | null
    review_count: number
  }) => ({
    name: c.name,
    place_id: c.place_id,
    avg_rating: c.avg_rating,
    review_count: c.review_count,
  }))

  // Mapa (geo_snapshots)
  const mapa = geoSnapshot ? {
    center: { lat: geoSnapshot.center_lat, lng: geoSnapshot.center_lng },
    radius_km: geoSnapshot.radius_km ?? 5,
    zonas: (geoSnapshot.regions as Array<{
      lat: number
      lng: number
      label: string
      count: number
      status: string
    }>) ?? [],
    week_start: geoSnapshot.week_start,
  } : null

  // Keywords top 10
  const topKeywords = (keywordRows ?? []).map((k: {
    keyword: string
    impressions: number
    clicks: number
    week_start: string
  }) => ({
    keyword: k.keyword,
    impressions: k.impressions ?? 0,
    clicks: k.clicks ?? 0,
    week_start: k.week_start,
  }))

  // Metricas de performance (GBP API com fallback para gmb_metrics)
  let metricas = {
    views_search: 0,
    views_maps: 0,
    clicks_website: 0,
    clicks_call: 0,
    clicks_directions: 0,
    period: 'Ultimos 30 dias',
    source: 'none' as 'api' | 'database' | 'none',
  }

  const locationName = org?.gbp_location_id
  if (locationName) {
    try {
      const accessToken = await getValidGmbToken(user.id)
      const gbpClient = new GBPClient(accessToken)
      const perfData = await gbpClient.getPerformanceMetrics(locationName)

      if (perfData.metricValues?.length) {
        for (const mv of perfData.metricValues) {
          const total = mv.dimensionalValues?.reduce(
            (sum: number, dv: { value: string }) => sum + (parseInt(dv.value, 10) || 0), 0
          ) ?? 0

          const metric = mv.metric?.toUpperCase() ?? ''
          if (metric.includes('SEARCH') && metric.includes('IMPRESSION')) metricas.views_search = total
          else if (metric.includes('MAPS') && metric.includes('IMPRESSION')) metricas.views_maps = total
          else if (metric.includes('WEBSITE')) metricas.clicks_website = total
          else if (metric.includes('CALL')) metricas.clicks_call = total
          else if (metric.includes('DIRECTION')) metricas.clicks_directions = total
        }
        metricas.source = 'api'
      }
    } catch {
      // API falhou, cai no fallback abaixo
    }
  }

  // Fallback: dados do banco (gmb_metrics)
  if (metricas.source === 'none' && gbpProfile?.id) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: metricRows } = await supabase
      .from('gmb_metrics')
      .select('views_search, views_maps, clicks_website, clicks_call, clicks_directions')
      .eq('profile_id', gbpProfile.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

    if (metricRows?.length) {
      metricas = {
        views_search: metricRows.reduce((sum: number, r: Record<string, number>) => sum + (r.views_search ?? 0), 0),
        views_maps: metricRows.reduce((sum: number, r: Record<string, number>) => sum + (r.views_maps ?? 0), 0),
        clicks_website: metricRows.reduce((sum: number, r: Record<string, number>) => sum + (r.clicks_website ?? 0), 0),
        clicks_call: metricRows.reduce((sum: number, r: Record<string, number>) => sum + (r.clicks_call ?? 0), 0),
        clicks_directions: metricRows.reduce((sum: number, r: Record<string, number>) => sum + (r.clicks_directions ?? 0), 0),
        period: 'Ultimos 30 dias',
        source: 'database',
      }
    }
  }

  // Reviews
  const ultimaAvaliacao = latestReview ? {
    autor: (latestReview as Record<string, unknown>).author_name as string,
    nota: (latestReview as Record<string, unknown>).rating as number,
    comentario: (latestReview as Record<string, unknown>).comment as string | null,
    data: (latestReview as Record<string, unknown>).published_at as string,
  } : null

  // Perfil
  const perfil = {
    nome: gbpProfile?.name ?? org?.name ?? '',
    endereco: gbpProfile?.address ?? '',
    categoria: org?.specialty ?? '',
    latitude: gbpProfile?.latitude ?? null,
    longitude: gbpProfile?.longitude ?? null,
    google_place_id: gbpProfile?.google_place_id ?? null,
    descricao: gbpProfile?.description ?? null,
    total_fotos: gbpProfile?.photo_count ?? 0,
  }

  const result = {
    score: {
      atual: scoreAtual,
      projetado: scoreProjetado,
      faixa: (s?.faixa as string) ?? 'fraca',
      tendencia: (s?.tendencia as string) ?? 'estavel',
      snapshot_date: (s?.snapshot_date as string) ?? null,
    },
    categorias,
    gaps: gaps.sort((a, b) => b.impact - a.impact),
    concorrentes: topConcorrentes,
    mapa,
    keywords: topKeywords,
    metricas,
    reviews: {
      ultima: ultimaAvaliacao,
      sem_resposta_count: unrepliedResult.count ?? 0,
    },
    perfil,
  }

  // Cache por 1 hora
  await cacheSet(cacheKey, result, CACHE_TTL)

  return privateJson(result)
}
