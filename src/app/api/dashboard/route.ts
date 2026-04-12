// API de dados do dashboard — busca tudo em uma chamada para < 2s de carregamento
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Busca paralela de todos os dados
  const [
    { data: org },
    { data: latestScore },
    { data: scoreHistory },
    { data: profile },
    { data: reviews },
    { data: pendingResponses },
    { data: pendingPosts },
    { data: recentPosts },
    { data: competitors },
  ] = await Promise.all([
    supabase.from('organizations').select('name, specialty').eq('id', orgId).single(),
    supabase.from('scores').select('*').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(1).single(),
    supabase.from('scores').select('total, snapshot_date, faixa').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(30),
    supabase.from('gbp_profiles').select('description, categories, photo_count, audit_report, benchmark_report, optimization_report').eq('organization_id', orgId).single(),
    supabase.from('reviews').select('id, rating, comment, author_name, published_at').eq('organization_id', orgId).order('published_at', { ascending: false }).limit(50),
    supabase.from('review_responses').select('id, generated_text, review_id').eq('organization_id', orgId).eq('status', 'pending'),
    supabase.from('posts').select('id, content, post_type, photo_suggestion').eq('organization_id', orgId).eq('status', 'pending'),
    supabase.from('posts').select('id, content, post_type, published_at, status').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10),
    supabase.from('competitors').select('name, avg_rating, review_count, last_tracked_at').eq('organization_id', orgId).limit(3),
  ])

  const reviewList = reviews ?? []
  const totalReviews = reviewList.length
  const avgRating = totalReviews > 0
    ? reviewList.reduce((s, r) => s + (r.rating ?? 0), 0) / totalReviews
    : 0
  const newThisMonth = reviewList.filter(r => r.published_at && new Date(r.published_at) >= thirtyDaysAgo).length

  const { data: publishedResponses } = await supabase
    .from('review_responses')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'published')

  const responseRate = totalReviews > 0
    ? (publishedResponses?.length ?? 0) / totalReviews
    : 0

  return NextResponse.json({
    organization: { id: orgId, name: org?.name, specialty: org?.specialty },
    professional: { name: professional.name, role: professional.role },
    score: latestScore ?? null,
    score_history: scoreHistory ?? [],
    profile: profile ?? null,
    reviews: {
      total: totalReviews,
      avg_rating: parseFloat(avgRating.toFixed(1)),
      new_this_month: newThisMonth,
      response_rate: parseFloat(responseRate.toFixed(2)),
      recent: reviewList.slice(0, 5),
    },
    pending: {
      responses: pendingResponses ?? [],
      posts: pendingPosts ?? [],
    },
    posts: {
      recent: recentPosts ?? [],
    },
    competitors: competitors ?? [],
  })
}
