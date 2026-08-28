import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ScoreHero } from './components/ScoreHero'
import { ReviewsCard } from './components/ReviewsCard'
import { PostsCard } from './components/PostsCard'
import { AuditGapsCard } from './components/AuditGapsCard'
import { CompetitorsCard } from './components/CompetitorsCard'
import { PendingActions } from './components/PendingActions'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!professional?.organization_id) return null

  const orgId = professional.organization_id
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

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

  return {
    userEmail: user.email ?? '',
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
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) redirect('/login')

  const hasPending =
    (data.pending.responses.length) + (data.pending.posts.length) > 0

  return (
    <DashboardLayout
      activeHref="/dashboard"
      profileName={data.organization.name ?? 'Meu Perfil'}
      userEmail={data.userEmail}
    >
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

        {/* Ações pendentes aparecem primeiro quando existem */}
        {hasPending && (
          <PendingActions
            responses={data.pending.responses}
            posts={data.pending.posts}
          />
        )}

        {/* Score */}
        <ScoreHero score={data.score} history={data.score_history} />

        {/* Diagnóstico */}
        <AuditGapsCard auditReport={data.profile?.audit_report ?? null} />

        {/* Avaliações */}
        <ReviewsCard reviews={data.reviews} />

        {/* Concorrentes */}
        <CompetitorsCard competitors={data.competitors} />

        {/* Posts recentes */}
        <PostsCard posts={data.posts.recent} />

      </div>
    </DashboardLayout>
  )
}
