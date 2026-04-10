import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { executeAction } from '@/lib/gmb/optimizer'
import { calculateScore } from '@/lib/gmb/scorer'
import { MOCK_PROFILE_DATA } from '@/lib/gmb/profile-mock'
import { trackEvent, recordScore } from '@/lib/analytics'
import type { OptimizationAction, ExecutionResult } from '@/lib/gmb/optimizer'
import type { GmbProfileData } from '@/lib/gmb/scorer'

export const dynamic = 'force-dynamic'

// POST /api/optimization/execute
// Body: { profileId, diagnosticId, actions: OptimizationAction[] }
// Executa cada ação sequencialmente e salva resultados no banco
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json() as {
    profileId: string
    diagnosticId: string
    actions: OptimizationAction[]
  }

  if (!body.profileId || !body.actions?.length) {
    return NextResponse.json({ error: 'profileId e actions são obrigatórios' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  // Verificar ownership
  const { data: profile } = await serviceClient
    .from('gmb_profiles')
    .select('id, category')
    .eq('id', body.profileId)
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  const profileData = { ...MOCK_PROFILE_DATA, category: profile.category ?? 'dentista' }
  const scoreBefore = calculateScore(profileData).total

  // Executar ações com delay de 300ms entre chamadas (evita rate limit)
  const results = []
  for (const action of body.actions) {
    const result = await executeAction(action, profileData)
    results.push(result)

    // Persistir no banco
    await serviceClient.from('optimization_actions').insert({
      profile_id: body.profileId,
      diagnostic_id: body.diagnosticId ?? null,
      type: action.type,
      status: result.status,
      payload: result.payload ?? {},
      error_message: result.error ?? null,
      executed_at: new Date().toISOString(),
    })

    await delay(300)
  }

  const updatedProfile = applyResults(profileData, results)
  const newScore = calculateScore(updatedProfile)

  // Registrar novo diagnóstico com scores por categoria
  await serviceClient.from('diagnostics').insert({
    profile_id: body.profileId,
    score_total: newScore.total,
    score_info_basica: newScore.categories.info.score,
    score_fotos: newScore.categories.photos.score,
    score_avaliacoes: newScore.categories.reviews.score,
    score_posts: newScore.categories.posts.score,
    score_servicos: newScore.categories.services.score,
    score_atributos: newScore.categories.attributes.score,
    issues: [
      ...newScore.categories.info.issues,
      ...newScore.categories.photos.issues,
      ...newScore.categories.reviews.issues,
      ...newScore.categories.posts.issues,
      ...newScore.categories.services.issues,
      ...newScore.categories.attributes.issues,
    ],
  })

  // Aha Moment: first_optimization (one-time) + score_history (North Star)
  trackEvent(serviceClient, user.id, 'first_optimization', {
    profileId: body.profileId,
    metadata: { score_before: scoreBefore, score_after: newScore.total },
  })
  recordScore(serviceClient, body.profileId, newScore.total)

  return NextResponse.json({ results, scoreBefore, scoreAfter: newScore.total })
}

function applyResults(profile: GmbProfileData, results: ExecutionResult[]): GmbProfileData {
  const updated: GmbProfileData = { ...profile }
  for (const r of results) {
    if (r.status !== 'done') continue
    switch (r.action.type) {
      case 'update_hours': updated.hasHours = true; break
      case 'update_categories': updated.hasCategory = true; break
      case 'update_attributes': updated.attributesCount = 5; break
      case 'add_services': updated.servicesCount = 3; updated.servicesWithDescCount = 3; break
    }
  }
  return updated
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
