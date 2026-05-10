import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { buildMockReviews } from '@/lib/gmb/reviews'
import type { ReviewFilter } from '@/lib/gmb/reviews'

// GET /api/reviews?filter=all|pending|negative&page=1
export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedProfile('id, name, category')
  if (auth.error) return auth.error

  const { profile, serviceClient } = auth

  const { searchParams } = new URL(req.url)
  const filter = (searchParams.get('filter') ?? 'all') as ReviewFilter
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = 10

  // Se não há reviews no banco, seed com mocks
  const { count } = await serviceClient
    .from('gmb_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profile.id)

  if ((count ?? 0) === 0 && process.env.GMB_MOCK === 'true') {
    const mocks = buildMockReviews(profile.id)
    await serviceClient.from('gmb_reviews').insert(mocks)
  }

  let query = serviceClient
    .from('gmb_reviews')
    .select('*', { count: 'exact' })
    .eq('profile_id', profile.id)
    .order('review_date', { ascending: false })

  if (filter === 'pending') query = query.eq('reply_status', 'pending')
  if (filter === 'negative') query = query.lte('rating', 2)

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data: reviews, count: total } = await query

  // Contagem de pendentes (para badge)
  const { count: pendingCount } = await serviceClient
    .from('gmb_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profile.id)
    .eq('reply_status', 'pending')

  return NextResponse.json({
    reviews: reviews ?? [],
    total: total ?? 0,
    pendingCount: pendingCount ?? 0,
    page,
    pageSize,
    profile: { id: profile.id, name: profile.name, category: profile.category },
  })
}
