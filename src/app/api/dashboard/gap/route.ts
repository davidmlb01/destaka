export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { analyzeGap } from '@/lib/ranking/gap-analyzer'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  // Buscar posição mais recente (keyword primária)
  const { data: primaryKw } = await supabase
    .from('ranking_keywords')
    .select('id, keyword')
    .eq('organization_id', orgId)
    .eq('is_primary', true)
    .maybeSingle()

  if (!primaryKw) {
    return privateJson({ empty: true })
  }

  const { data: latestPos } = await supabase
    .from('ranking_positions')
    .select('position, top_competitor_name, top_competitor_reviews, snapshot_date')
    .eq('keyword_id', primaryKw.id)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestPos?.top_competitor_name) {
    return privateJson({ empty: true })
  }

  // Buscar dados do perfil do usuário
  const { data: profile } = await supabase
    .from('gbp_profiles')
    .select('photo_count')
    .eq('organization_id', orgId)
    .maybeSingle()

  const { data: gmbProfile } = await supabase
    .from('gmb_profiles')
    .select('website')
    .eq('user_id', (await supabase.from('professionals').select('user_id').eq('organization_id', orgId).maybeSingle()).data?.user_id ?? '')
    .maybeSingle()

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: respondedCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .not('response_text', 'is', null)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { count: recentPostCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .gte('published_at', thirtyDaysAgo.toISOString())

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .maybeSingle()

  const { data: score } = await supabase
    .from('scores')
    .select('total')
    .eq('organization_id', orgId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Buscar place_id do top competitor
  const { data: competitor } = await supabase
    .from('competitors')
    .select('place_id')
    .eq('profile_id', (await supabase.from('gmb_profiles').select('id').eq('user_id', (await supabase.from('professionals').select('user_id').eq('organization_id', orgId).maybeSingle()).data?.user_id ?? '').maybeSingle()).data?.id ?? '')
    .ilike('name', `%${latestPos.top_competitor_name.split(' ').slice(0, 2).join(' ')}%`)
    .limit(1)
    .maybeSingle()

  if (!competitor?.place_id) {
    return privateJson({ empty: true, reason: 'competitor_not_found' })
  }

  const totalReviews = reviewCount ?? 0
  const responseRate = totalReviews > 0 ? (respondedCount ?? 0) / totalReviews : 0

  const gap = await analyzeGap(
    {
      name: org?.name ?? '',
      rating: (score?.total ?? 50) > 70 ? 5.0 : 4.8,
      reviewCount: totalReviews,
      photoCount: profile?.photo_count ?? 0,
      hasWebsite: !!gmbProfile?.website,
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
