export const dynamic = 'force-dynamic'
import { privateJson } from '@/lib/api/with-auth'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActivePlan, generatePlan, savePlan } from '@/lib/plan/plan-generator'

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
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const plan = await getActivePlan(supabase, professional.organization_id)

  if (!plan) {
    return NextResponse.json({ plan: null })
  }

  const completedSteps = plan.steps.filter(s => s.status === 'done').length
  const pointsGained = plan.steps.filter(s => s.status === 'done').reduce((sum, s) => sum + s.impact, 0)
  const pointsRemaining = plan.steps.filter(s => s.status !== 'done' && s.status !== 'skipped').reduce((sum, s) => sum + s.impact, 0)

  const now = new Date()
  const expires = new Date(plan.expires_at)
  const daysRemaining = Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  return NextResponse.json({
    plan: {
      id: plan.id,
      current_score: plan.current_score,
      competitor_max_score: plan.competitor_max_score,
      target_score: plan.target_score,
      status: plan.status,
      progress: {
        total_steps: plan.steps.length,
        completed_steps: completedSteps,
        percentage: plan.steps.length > 0 ? Math.round((completedSteps / plan.steps.length) * 100) : 0,
        points_gained: pointsGained,
        points_remaining: pointsRemaining,
      },
      steps: plan.steps,
      created_at: plan.created_at,
      expires_at: plan.expires_at,
      days_remaining: daysRemaining,
    },
  })
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id

  // Buscar dados para gerar plano
  const [{ data: gbpProfile }, { data: reviews }, { data: score }] = await Promise.all([
    supabase.from('gbp_profiles').select('id, description, categories, attributes, photo_count, hours, services').eq('organization_id', orgId).maybeSingle(),
    supabase.from('reviews').select('id, rating, response_text').eq('organization_id', orgId),
    supabase.from('scores').select('total').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
  ])

  // Competitors usa profile_id (FK para gmb_profiles.id), nao organization_id
  const gmbProfileId = gbpProfile?.id
  const { data: competitors } = gmbProfileId
    ? await supabase.from('competitors').select('avg_rating, review_count, photo_count').eq('profile_id', gmbProfileId)
    : { data: [] }

  const reviewList = reviews ?? []
  const repliedCount = reviewList.filter((r: { response_text: string | null }) => !!r.response_text).length

  const scoreCtx = {
    hasDescription: !!(gbpProfile?.description as string)?.trim(),
    categoryCount: ((gbpProfile?.categories as string[]) ?? []).length,
    attributeCount: Array.isArray(gbpProfile?.attributes) ? (gbpProfile.attributes as unknown[]).length : 0,
    photoCount: (gbpProfile?.photo_count as number) ?? 0,
    hasHours: !!gbpProfile?.hours,
    recentPostCount: 0,
    reviewCount: reviewList.length,
    avgRating: reviewList.length > 0
      ? reviewList.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewList.length
      : 0,
    reviewResponseRate: reviewList.length > 0 ? repliedCount / reviewList.length : 0,
    hasWebsite: true,
    totalScore: (score?.total as number) ?? 0,
  }

  const compList = competitors ?? []
  const competitorCtx = compList.length > 0 ? {
    maxScore: 78, // estimativa, concorrentes não têm score Destaka
    avgPhotoCount: compList.reduce((sum: number, c: { photo_count: number }) => sum + (c.photo_count ?? 0), 0) / compList.length,
    avgReviewCount: compList.reduce((sum: number, c: { review_count: number }) => sum + (c.review_count ?? 0), 0) / compList.length,
  } : null

  const plan = generatePlan(scoreCtx, competitorCtx)

  try {
    await savePlan(supabase, orgId, plan)
  } catch (err) {
    console.error('[plan/surpass] save error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Erro ao salvar plano' }, { status: 500 })
  }

  return NextResponse.json({ success: true, steps: plan.steps.length })
}
