import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

  // Buscar gmb_profile do usuario para FK de competitors
  const { data: gmbProfile } = await supabase
    .from('gmb_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const gmbProfileId = gmbProfile?.id

  // Fetch competitors, org info, and GBP profile in parallel
  const [
    { data: competitors },
    { data: org },
    { data: gbp },
  ] = await Promise.all([
    gmbProfileId
      ? supabase
          .from('competitors')
          .select('id, place_id, name, avg_rating, review_count, address, photo_count, categories, has_website, benchmark_data, last_tracked_at')
          .eq('profile_id', gmbProfileId)
      : Promise.resolve({ data: [] }),
    supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .maybeSingle(),
    supabase
      .from('gbp_profiles')
      .select('id, audit_report')
      .eq('organization_id', orgId)
      .maybeSingle(),
  ])

  // Extract avg_rating and review_count from audit_report
  const auditReport = gbp?.audit_report as {
    avg_rating?: number
    review_count?: number
  } | null

  // Map competitors to expected Competitor shape
  const mappedCompetitors = (competitors ?? []).map((c: {
    id: string
    place_id: string
    name: string
    avg_rating: number | null
    review_count: number
    address: string | null
    photo_count: number
    categories: string[]
    has_website: boolean
    benchmark_data: unknown
    last_tracked_at: string
  }) => ({
    id: c.id,
    profile_id: orgId,
    place_id: c.place_id,
    name: c.name,
    avg_rating: c.avg_rating,
    review_count: c.review_count,
    address: c.address,
    photo_count: c.photo_count,
    categories: c.categories ?? [],
    has_website: c.has_website,
    benchmark_data: c.benchmark_data,
    last_tracked_at: c.last_tracked_at,
  }))

  return NextResponse.json({
    profile: {
      id: gbp?.id ?? orgId,
      name: org?.name ?? 'Meu Perfil',
      avg_rating: auditReport?.avg_rating ?? null,
      review_count: auditReport?.review_count ?? null,
    },
    competitors: mappedCompetitors,
  })
}
