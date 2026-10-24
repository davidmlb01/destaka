export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { analyzeCompetitors, type CompetitorSnapshot } from '@/lib/gbp/competitor-engine'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('x-admin-key')
  if (authHeader !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { organization_id?: string }
  const orgId = body.organization_id
  if (!orgId) return NextResponse.json({ error: 'organization_id required' }, { status: 400 })

  const db = admin()

  const { data: org } = await db.from('organizations').select('name, specialty').eq('id', orgId).maybeSingle()
  if (!org) return NextResponse.json({ error: 'org nao encontrada' }, { status: 404 })

  const { data: profile } = await db.from('gbp_profiles')
    .select('location_id, description, categories, photo_count')
    .eq('organization_id', orgId)
    .order('last_synced_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Buscar competitors via gmb_profiles FK
  const { data: gmbProf } = await db.from('gmb_profiles').select('id').eq('name', org.name).maybeSingle()
  const { data: competitors } = gmbProf?.id
    ? await db.from('competitors').select('name, place_id, categories, review_count, avg_rating').eq('profile_id', gmbProf.id)
    : { data: [] }

  if (!competitors || competitors.length === 0) {
    return NextResponse.json({ error: 'sem concorrentes para benchmark' }, { status: 404 })
  }

  const competitorSnapshots: CompetitorSnapshot[] = (competitors ?? []).map((c: { name: string; place_id: string; categories: string[]; review_count: number; avg_rating: number | null }) => ({
    name: c.name,
    place_id: c.place_id,
    categories: c.categories ?? [],
    review_count: c.review_count ?? 0,
    avg_rating: c.avg_rating ?? 0,
  }))

  try {
    const benchmark = await analyzeCompetitors({
      ownName: org.name,
      ownReviewCount: 168,
      ownAvgRating: 5.0,
      ownCategoryCount: (profile?.categories ?? []).length,
      ownHasDescription: !!profile?.description,
      ownPhotoCount: profile?.photo_count ?? 0,
      competitors: competitorSnapshots,
      specialty: org.specialty,
    })

    // Salvar no gbp_profiles
    if (profile?.location_id) {
      await db.from('gbp_profiles')
        .update({ benchmark_report: benchmark })
        .eq('organization_id', orgId)
        .eq('location_id', profile.location_id)
    }

    return NextResponse.json({
      ok: true,
      opportunities: benchmark.opportunities?.length ?? 0,
      keyword_gaps: benchmark.teardown?.keyword_gaps?.length ?? 0,
    })
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'unknown',
    }, { status: 500 })
  }
}
