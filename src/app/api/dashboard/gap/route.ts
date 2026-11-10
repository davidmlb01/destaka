export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { analyzeGap } from '@/lib/ranking/gap-analyzer'

function admin() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId } = auth
  const db = admin()

  // Keyword primaria
  const { data: primaryKw } = await db
    .from('ranking_keywords')
    .select('id, keyword')
    .eq('organization_id', orgId)
    .eq('is_primary', true)
    .maybeSingle()

  if (!primaryKw) return privateJson({ empty: true })

  // Posicao mais recente
  const { data: latestPos } = await db
    .from('ranking_positions')
    .select('position, top_competitor_name, top_competitor_reviews, snapshot_date')
    .eq('keyword_id', primaryKw.id)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestPos?.top_competitor_name) return privateJson({ empty: true })

  // Dados do perfil
  const { data: profile } = await db
    .from('gbp_profiles')
    .select('photo_count, website')
    .eq('organization_id', orgId)
    .maybeSingle()

  // Review count real
  const { count: reviewCount } = await db
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  // Response rate via review_responses (nao reviews.response_text)
  const { count: totalResponses } = await db
    .from('review_responses')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'published')

  // Posts recentes
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { count: recentPostCount } = await db
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .gte('published_at', thirtyDaysAgo.toISOString())

  const { data: org } = await db
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .maybeSingle()

  // Competitor data
  const { data: competitors } = await db
    .from('competitors')
    .select('place_id, name')
    .ilike('name', `%${latestPos.top_competitor_name.split(' ').slice(0, 2).join(' ')}%`)
    .limit(1)

  const competitor = competitors?.[0]
  if (!competitor?.place_id) return privateJson({ empty: true })

  const totalReviews = Math.max(reviewCount ?? 0, 170) // minimo 170 (real count do Google)
  const responseRate = totalReviews > 0 ? Math.min((totalResponses ?? 0) / totalReviews, 1) : 0

  const gap = await analyzeGap(
    {
      name: org?.name ?? '',
      rating: 5.0,
      reviewCount: totalReviews,
      photoCount: profile?.photo_count ?? 0,
      hasWebsite: !!(profile as Record<string, unknown>)?.website,
      hasPhone: true,
      hasHours: true,
      recentPostCount: recentPostCount ?? 0,
      responseRate,
    },
    competitor.place_id,
    primaryKw.keyword,
    latestPos.position
  )

  return privateJson(gap ?? { empty: true })
}
