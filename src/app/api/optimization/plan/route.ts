export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { buildOptimizationPlan, type OptimizationAction } from '@/lib/gmb/optimizer'
import { calculateScore, type GmbProfileData } from '@/lib/gmb/scorer'
import { getLatestAnalysis, type CompetitiveGap } from '@/lib/gmb/competitive-analyzer'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  // Buscar perfil GBP e reviews para construir o profileData
  const [{ data: gbpProfile }, { data: reviews }, { data: org }] = await Promise.all([
    supabase.from('gbp_profiles').select('*').eq('organization_id', orgId).maybeSingle(),
    supabase.from('reviews').select('id, rating, response_text').eq('organization_id', orgId),
    supabase.from('organizations').select('specialty').eq('id', orgId).single(),
  ])

  if (!gbpProfile) {
    return NextResponse.json({ error: 'Perfil GBP não encontrado. Sincronize primeiro.' }, { status: 404 })
  }

  const profile = gbpProfile as Record<string, unknown>
  const categories = (profile.categories as string[]) ?? []
  const services = (profile.services as Array<unknown>) ?? []
  const attributes = (profile.attributes as Array<unknown>) ?? []
  const photoCount = (profile.photo_count as number) ?? 0
  const hours = profile.hours as Record<string, unknown> | null
  const reviewList = reviews ?? []
  const repliedCount = reviewList.filter((r: { response_text: string | null }) => !!r.response_text).length

  const profileData: GmbProfileData = {
    hasName: !!profile.name,
    hasPhone: !!profile.phone,
    hasAddress: !!profile.address,
    hasHours: !!hours,
    hasWebsite: true,
    hasCategory: categories.length > 0,
    hasLogoPhoto: photoCount >= 2,
    hasCoverPhoto: photoCount >= 1,
    spacePhotosCount: Math.max(0, photoCount - 2),
    totalPhotosCount: photoCount,
    reviewsCount: reviewList.length,
    reviewsAvgRating: reviewList.length > 0
      ? reviewList.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewList.length
      : 0,
    reviewsRepliedCount: repliedCount,
    lastPostDaysAgo: null,
    servicesCount: services.length,
    servicesWithDescCount: services.length,
    attributesCount: attributes.length,
    category: categories[0] ?? org?.specialty ?? 'establishment',
    locationName: (profile.name as string) ?? '',
  }

  const score = calculateScore(profileData)
  const plan = buildOptimizationPlan(profileData, score)

  // Enriquecer com acoes competitivas
  const analysis = await getLatestAnalysis(supabase, orgId)
  let competitiveActions: Array<OptimizationAction & { source: string }> = []
  let competitiveSummary = null

  if (analysis && analysis.gaps.length > 0) {
    competitiveActions = analysis.gaps
      .filter((g: CompetitiveGap) => g.suggested_action !== null)
      .map((g: CompetitiveGap) => ({
        ...g.suggested_action!,
        source: 'competitive',
      }))

    competitiveSummary = {
      analyzed_at: analysis.analyzed_at,
      total_gaps: analysis.gaps.length,
      high_priority: analysis.gaps.filter((g: CompetitiveGap) => g.priority === 'high').length,
      estimated_score_gain: competitiveActions.reduce((sum, a) => sum + a.impact, 0),
    }
  }

  // Merge: acoes de completude (source: audit) + acoes competitivas (source: competitive)
  const allActions = [
    ...plan.actions.map(a => ({ ...a, source: 'audit' })),
    ...competitiveActions,
  ]

  const totalGain = allActions.reduce((sum, a) => sum + a.impact, 0)

  return privateJson({
    actions: allActions,
    currentScore: plan.currentScore,
    projectedScore: Math.min(100, plan.currentScore + totalGain),
    competitive_summary: competitiveSummary,
  })
}
