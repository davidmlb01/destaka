export const dynamic = 'force-dynamic'

// GET /api/diagnostico/[hash]
// URL publica (read-only, sem dados sensiveis)
// Lookup direto por share_hash (indexed), sem full table scan
// Fallback para hash computation se share_hash nao populado ainda

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { cacheGet, cacheSet, rateLimit } from '@/lib/redis'

const CACHE_TTL = 3600 // 1 hora

function getServiceDb() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params

  if (!hash || hash.length !== 16) {
    return NextResponse.json({ error: 'Link invalido' }, { status: 400 })
  }

  // Rate limit per hash (prevent brute-force enumeration)
  const rlCount = await rateLimit(`ratelimit:diag:${hash}`, 3600)
  if (rlCount === null) {
    return NextResponse.json({ error: 'Servico temporariamente indisponivel' }, { status: 503 })
  }
  if (rlCount >= 30) {
    return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente em 1 hora.' }, { status: 429 })
  }

  // Cache
  const cacheKey = `diag-pub:${hash}`
  const cached = await cacheGet<Record<string, unknown>>(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    })
  }

  const encryptionKey = process.env.ENCRYPTION_KEY
  if (!encryptionKey) {
    console.error('[security] ENCRYPTION_KEY not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const db = getServiceDb()

  // Direct indexed lookup by share_hash (O(1) instead of O(n))
  let matchedOrg: { id: string; name: string; specialty: string } | null = null

  const { data: directMatch } = await db
    .from('organizations')
    .select('id, name, specialty')
    .eq('share_hash', hash)
    .maybeSingle()

  if (directMatch) {
    matchedOrg = directMatch
  } else {
    // Fallback: orgs without share_hash populated yet (pre-migration backfill)
    const { data: orgs } = await db
      .from('organizations')
      .select('id, name, specialty')
      .is('share_hash', null)

    const found = (orgs ?? []).find(
      (o: { id: string }) =>
        createHash('sha256').update(o.id + encryptionKey).digest('hex').slice(0, 16) === hash
    )
    if (found) {
      matchedOrg = found
      // Backfill share_hash for this org so next lookup is direct
      await db.from('organizations').update({ share_hash: hash }).eq('id', found.id)
    }
  }

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
    db
      .from('scores')
      .select('total, projected_score, gmb_completude, reputacao, visibilidade, retencao, conversao, faixa, snapshot_date')
      .eq('organization_id', orgId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from('gbp_profiles')
      .select('name, address, audit_report, categories, photo_count')
      .eq('organization_id', orgId)
      .maybeSingle(),
    db
      .from('geo_snapshots')
      .select('center_lat, center_lng, radius_km, regions, week_start')
      .eq('org_id', orgId)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
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
