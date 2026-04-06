import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buildMockReviews } from '@/lib/gmb/reviews'
import type { ReviewFilter } from '@/lib/gmb/reviews'

// GET /api/reviews?filter=all|pending|negative&page=1
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filter = (searchParams.get('filter') ?? 'all') as ReviewFilter
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = 10

  const serviceClient = await createServiceClient()

  const { data: profile } = await serviceClient
    .from('gmb_profiles')
    .select('id, name, category')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile) return NextResponse.json({ error: 'Nenhum perfil encontrado' }, { status: 404 })

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
