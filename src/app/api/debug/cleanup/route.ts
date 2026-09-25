// TEMPORARIO: limpa dados de teste antigos e mantém só dados reais da GBP API
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  }

  const orgId = professional.organization_id
  const db = admin()

  // Buscar o gbp_location_id real da org (definido pelo audit)
  const { data: org } = await db
    .from('organizations')
    .select('gbp_location_id')
    .eq('id', orgId)
    .single()

  const realLocationId = org?.gbp_location_id

  const results: Record<string, unknown> = { orgId, realLocationId }

  // Deletar scores antigos (dados de teste manuais)
  const { count: deletedScores } = await db
    .from('scores')
    .delete({ count: 'exact' })
    .eq('organization_id', orgId)

  results.deletedScores = deletedScores

  // Deletar gmb_metrics antigos (dados de teste manuais)
  const { data: gmbProfile } = await db
    .from('gmb_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (gmbProfile?.id) {
    const { count: deletedMetrics } = await db
      .from('gmb_metrics')
      .delete({ count: 'exact' })
      .eq('profile_id', gmbProfile.id)
    results.deletedMetrics = deletedMetrics
  }

  // Deletar gbp_profiles que NAO sao o location_id real
  if (realLocationId) {
    const { count: deletedProfiles } = await db
      .from('gbp_profiles')
      .delete({ count: 'exact' })
      .eq('organization_id', orgId)
      .neq('location_id', realLocationId)
    results.deletedOldProfiles = deletedProfiles
  }

  // Deletar reviews antigos (dados de teste manuais, review_id nao comeca com accounts/)
  const { data: fakeReviews } = await db
    .from('reviews')
    .select('id, review_id')
    .eq('organization_id', orgId)

  const fakeIds = (fakeReviews ?? [])
    .filter((r: { review_id: string }) => !r.review_id.startsWith('accounts/'))
    .map((r: { id: string }) => r.id)

  if (fakeIds.length > 0) {
    await db.from('reviews').delete().in('id', fakeIds)
  }
  results.deletedFakeReviews = fakeIds.length

  results.status = 'cleanup complete'
  return NextResponse.json(results)
}
