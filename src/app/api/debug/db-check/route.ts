// TEMPORARIO: verifica o que existe no banco para a org do usuario
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupa } from '@supabase/supabase-js'

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
    return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  }

  const orgId = professional.organization_id
  const db = createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: org },
    { data: gbpProfiles, count: gbpCount },
    { data: scores, count: scoresCount },
    { data: reviews, count: reviewsCount },
    { data: googleTokens },
  ] = await Promise.all([
    db.from('organizations').select('id, name, gbp_location_id').eq('id', orgId).single(),
    db.from('gbp_profiles').select('id, organization_id, location_id, name, last_synced_at, photo_count', { count: 'exact' }).eq('organization_id', orgId),
    db.from('scores').select('id, total, snapshot_date, faixa', { count: 'exact' }).eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(5),
    db.from('reviews').select('id, review_id, rating, author_name', { count: 'exact' }).eq('organization_id', orgId).limit(5),
    db.from('google_tokens').select('organization_id, access_token').eq('organization_id', orgId).maybeSingle(),
  ])

  return NextResponse.json({
    org,
    gbpProfiles: { count: gbpCount, rows: gbpProfiles },
    scores: { count: scoresCount, rows: scores },
    reviews: { count: reviewsCount, rows: reviews?.map(r => ({ ...r, review_id: (r.review_id as string)?.slice(0, 30) + '...' })) },
    hasToken: !!googleTokens?.access_token,
    tokenPrefix: googleTokens?.access_token?.slice(0, 10) + '...',
  })
}
