import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ScoreHero } from './components/ScoreHero'
import { ReviewsCard } from './components/ReviewsCard'
import { PostsCard } from './components/PostsCard'
import { AuditGapsCard } from './components/AuditGapsCard'
import { CompetitorsCard } from './components/CompetitorsCard'
import { PendingActions } from './components/PendingActions'
import { PopulateTrigger } from './components/PopulateTrigger'
import { SafeRender } from './SafeRender'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) return null

  const orgId = professional.organization_id

  const results = await Promise.allSettled([
    supabase.from('organizations').select('name, specialty').eq('id', orgId).maybeSingle(),
    supabase.from('scores').select('*').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('scores').select('total, snapshot_date, faixa').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(30),
    supabase.from('gbp_profiles').select('description, categories, photo_count, audit_report, benchmark_report, optimization_report').eq('organization_id', orgId).maybeSingle(),
    supabase.from('reviews').select('id, rating, comment, author_name, published_at').eq('organization_id', orgId).order('published_at', { ascending: false }).limit(50),
    supabase.from('review_responses').select('id, generated_text, review_id').eq('organization_id', orgId).eq('status', 'pending'),
    supabase.from('posts').select('id, content, post_type, photo_suggestion').eq('organization_id', orgId).eq('status', 'pending'),
    supabase.from('posts').select('id, content, post_type, published_at, status').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(10),
    supabase.from('competitors').select('name, avg_rating, review_count, last_tracked_at').eq('organization_id', orgId).limit(3),
  ])

  const getValue = (idx: number) => {
    const r = results[idx]
    if (r.status === 'fulfilled') return r.value.data
    console.error(`[Dashboard] Query ${idx} failed:`, r.reason)
    return null
  }

  const org = getValue(0)
  const latestScore = getValue(1)
  const scoreHistory = getValue(2) ?? []
  const profile = getValue(3)
  const reviews = getValue(4) ?? []
  const pendingResponses = getValue(5) ?? []
  const pendingPosts = getValue(6) ?? []
  const recentPosts = getValue(7) ?? []
  const competitors = getValue(8) ?? []

  const totalReviews = reviews.length
  const avgRating = totalReviews > 0
    ? reviews.reduce((s: number, r: { rating?: number }) => s + (r.rating ?? 0), 0) / totalReviews
    : 0
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const newThisMonth = reviews.filter((r: { published_at?: string }) => r.published_at && new Date(r.published_at) >= thirtyDaysAgo).length

  const { data: publishedResponses } = await supabase
    .from('review_responses')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'published')

  const responseRate = totalReviews > 0
    ? ((publishedResponses?.length ?? 0) / totalReviews)
    : 0

  return {
    userEmail: user.email ?? '',
    organization: { id: orgId, name: org?.name, specialty: org?.specialty },
    professional: { name: professional.name, role: professional.role },
    score: latestScore ?? null,
    score_history: scoreHistory,
    profile: profile ?? null,
    reviews: {
      total: totalReviews,
      avg_rating: parseFloat(avgRating.toFixed(1)),
      new_this_month: newThisMonth,
      response_rate: parseFloat(responseRate.toFixed(2)),
      recent: reviews.slice(0, 5),
    },
    pending: {
      responses: pendingResponses,
      posts: pendingPosts,
    },
    posts: {
      recent: recentPosts,
    },
    competitors: competitors,
  }
}

export default async function DashboardPage() {
  let data = null
  try {
    data = await getDashboardData()
  } catch (err) {
    console.error('[Dashboard] getDashboardData crashed:', err)
  }

  if (!data) redirect('/onboarding')

  const hasPending =
    (data.pending.responses.length) + (data.pending.posts.length) > 0

  return (
    <DashboardLayout
      activeHref="/dashboard"
      profileName={data.organization.name ?? 'Meu Perfil'}
      userEmail={data.userEmail}
    >
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

        <SafeRender name="PopulateTrigger">
          <PopulateTrigger
            orgName={data.organization.name ?? ''}
            hasScore={!!data.score}
            hasProfile={!!data.profile}
          />
        </SafeRender>

        {hasPending && (
          <SafeRender name="PendingActions">
            <PendingActions
              responses={data.pending.responses}
              posts={data.pending.posts}
            />
          </SafeRender>
        )}

        <SafeRender name="ScoreHero">
          <ScoreHero score={data.score} history={data.score_history} />
        </SafeRender>

        <SafeRender name="AuditGapsCard">
          <AuditGapsCard auditReport={data.profile?.audit_report ?? null} />
        </SafeRender>

        <SafeRender name="ReviewsCard">
          <ReviewsCard reviews={data.reviews} />
        </SafeRender>

        <SafeRender name="CompetitorsCard">
          <CompetitorsCard competitors={data.competitors} />
        </SafeRender>

        <SafeRender name="PostsCard">
          <PostsCard posts={data.posts.recent} />
        </SafeRender>

      </div>
    </DashboardLayout>
  )
}
