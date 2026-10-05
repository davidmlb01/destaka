export const dynamic = 'force-dynamic'

// GET /api/diagnostico/[hash]
// URL publica (read-only, sem dados sensiveis)
// Hash = sha256(orgId + ENCRYPTION_KEY).slice(0, 16)
// Sem autenticacao. Sem metricas de performance, sem tokens, sem dados internos.

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { cacheGet, cacheSet } from '@/lib/redis'

const CACHE_TTL = 3600 // 1 hora

function generateHash(orgId: string): string {
  return createHash('sha256')
    .update(orgId + (process.env.ENCRYPTION_KEY ?? ''))
    .digest('hex')
    .slice(0, 16)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params

  if (!hash || hash.length !== 16) {
    return NextResponse.json({ error: 'Link invalido' }, { status: 400 })
  }

  // Cache
  const cacheKey = `diag-pub:${hash}`
  const cached = await cacheGet<Record<string, unknown>>(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    })
  }

  const supabase = await createClient()

  // Buscar todas as orgs e verificar qual bate com o hash
  // (por seguranca, nao expoe orgId na URL)
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, specialty')

  const matchedOrg = (orgs ?? []).find((o: { id: string }) => generateHash(o.id) === hash)

  if (!matchedOrg) {
    return NextResponse.json({ error: 'Diagnostico nao encontrado' }, { status: 404 })
  }

  const orgId = matchedOrg.id

  // Busca paralela (dados publicos apenas)
  const [
    { data: latestScore },
    { data: gbpProfile },
    { data: geoSnapshot },
    { data: keywordRows },
  ] = await Promise.all([
    supabase
      .from('scores')
      .select('total, projected_score, gmb_completude, reputacao, visibilidade, retencao, conversao, faixa, snapshot_date')
      .eq('organization_id', orgId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('gbp_profiles')
      .select('name, address, audit_report, categories, photo_count')
      .eq('organization_id', orgId)
      .maybeSingle(),
    supabase
      .from('geo_snapshots')
      .select('center_lat, center_lng, radius_km, regions, week_start')
      .eq('org_id', orgId)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('keyword_snapshots')
      .select('keyword, impressions, week_start')
      .eq('org_id', orgId)
      .order('week_start', { ascending: false })
      .order('impressions', { ascending: false })
      .limit(10),
  ])

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

  // Gaps do audit_report (sem dados sensiveis)
  const auditReport = gbpProfile?.audit_report as Record<string, unknown> | null
  const gaps: Array<{ field: string; severity: string; message: string; impact: number }> = []
  if (auditReport && typeof auditReport === 'object') {
    const auditIssues = (auditReport as { issues?: Array<{ field: string; severity: string; message: string; impact: number }> }).issues
    if (Array.isArray(auditIssues)) {
      gaps.push(...auditIssues)
    }
  }

  // Mapa (dados publicos)
  const mapa = geoSnapshot ? {
    center: { lat: geoSnapshot.center_lat, lng: geoSnapshot.center_lng },
    radius_km: geoSnapshot.radius_km ?? 5,
    total_zonas: ((geoSnapshot.regions as unknown[]) ?? []).length,
    week_start: geoSnapshot.week_start,
  } : null

  // Keywords top 10 (sem clicks, dado sensivel)
  const topKeywords = (keywordRows ?? []).map((k: {
    keyword: string
    impressions: number
    week_start: string
  }) => ({
    keyword: k.keyword,
    impressions: k.impressions ?? 0,
    week_start: k.week_start,
  }))

  // Perfil publico (sem coordenadas exatas, sem google_place_id)
  const perfil = {
    nome: gbpProfile?.name ?? matchedOrg.name ?? '',
    endereco: gbpProfile?.address ?? '',
    categoria: matchedOrg.specialty ?? '',
    total_fotos: gbpProfile?.photo_count ?? 0,
  }

  const result = {
    score: {
      atual: scoreAtual,
      projetado: scoreProjetado,
      faixa: (s?.faixa as string) ?? 'fraca',
      snapshot_date: (s?.snapshot_date as string) ?? null,
    },
    categorias,
    gaps: gaps.sort((a, b) => b.impact - a.impact),
    mapa,
    keywords: topKeywords,
    perfil,
  }

  // Cache por 1 hora
  await cacheSet(cacheKey, result, CACHE_TTL)

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
  })
}
