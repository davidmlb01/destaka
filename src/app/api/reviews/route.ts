import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 10

export async function GET(request: NextRequest) {
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
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') ?? 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // Build query with left join to review_responses for reply status
  let query = supabase
    .from('reviews')
    .select('id, review_id, author_name, rating, comment, published_at, created_at', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('published_at', { ascending: false })

  // Apply filters
  if (filter === 'pending') {
    // Reviews without a response (pending, published, or approved)
    const { data: respondedIds } = await supabase
      .from('review_responses')
      .select('review_id')
      .eq('organization_id', orgId)
      .in('status', ['pending', 'approved', 'published'])

    const excludeIds = (respondedIds ?? []).map((r: { review_id: string }) => r.review_id)
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`)
    }
  } else if (filter === 'negative') {
    query = query.lte('rating', 2)
  } else if (filter === 'pending_approval') {
    // Reviews that have a review_response with status 'pending'
    const { data: pendingResponses } = await supabase
      .from('review_responses')
      .select('review_id')
      .eq('organization_id', orgId)
      .eq('status', 'pending')

    const pendingReviewIds = (pendingResponses ?? []).map((r: { review_id: string }) => r.review_id)
    if (pendingReviewIds.length > 0) {
      query = query.in('id', pendingReviewIds)
    } else {
      // No pending approvals, return empty
      return NextResponse.json({
        reviews: [],
        total: 0,
        pendingCount: 0,
        page,
        pageSize: PAGE_SIZE,
        profile: await getProfile(supabase, orgId),
      })
    }
  }

  // Execute paginated query
  const { data: reviews, count, error } = await query.range(offset, offset + PAGE_SIZE - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get review_responses for these reviews to attach reply info
  const reviewIds = (reviews ?? []).map((r: { id: string }) => r.id)
  const { data: responses } = reviewIds.length > 0
    ? await supabase
        .from('review_responses')
        .select('review_id, generated_text, status')
        .eq('organization_id', orgId)
        .in('review_id', reviewIds)
    : { data: [] }

  const responseMap = new Map(
    (responses ?? []).map((r: { review_id: string; generated_text: string; status: string }) => [r.review_id, r])
  )

  // Count pending approvals for badge
  const { count: pendingCount } = await supabase
    .from('review_responses')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'pending')

  // Map to the Review shape expected by useReviews
  const mappedReviews = (reviews ?? []).map((r: {
    id: string
    review_id: string
    author_name: string
    rating: number
    comment: string | null
    published_at: string
    created_at: string
  }) => {
    const resp = responseMap.get(r.id) as { generated_text: string; status: string } | undefined
    const replyStatus = resp
      ? (resp.status === 'published' ? 'replied' : resp.status as string)
      : 'pending'

    return {
      id: r.id,
      profile_id: orgId,
      google_review_id: r.review_id,
      author: r.author_name,
      rating: r.rating,
      text: r.comment,
      reply: resp?.status === 'published' ? resp.generated_text : null,
      ai_reply_draft: resp && resp.status !== 'published' ? resp.generated_text : null,
      reply_status: replyStatus,
      review_date: r.published_at,
      created_at: r.created_at,
    }
  })

  return NextResponse.json({
    reviews: mappedReviews,
    total: count ?? 0,
    pendingCount: pendingCount ?? 0,
    page,
    pageSize: PAGE_SIZE,
    profile: await getProfile(supabase, orgId),
  })
}

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string) {
  const [{ data: org }, { data: gbp }] = await Promise.all([
    supabase.from('organizations').select('name, specialty').eq('id', orgId).maybeSingle(),
    supabase.from('gbp_profiles').select('id').eq('organization_id', orgId).maybeSingle(),
  ])

  return {
    id: gbp?.id ?? orgId,
    name: org?.name ?? 'Meu Perfil',
    category: org?.specialty ?? '',
  }
}
