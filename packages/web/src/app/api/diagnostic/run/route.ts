import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { runDiagnosis } from '@/lib/gmb/diagnosis'
import { syncProfileReviews } from '@/lib/gmb/reviews'
import { sendDiagnosticReadyEmail } from '@/lib/email/diagnostic-ready'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { logger } from '@/lib/logger'
import { rateLimitStrict } from '@/lib/redis'

// POST /api/diagnostic/run
// Roda o diagnóstico completo de um perfil GMB e salva no banco.
// Body: { profileId: string }
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // HIGH-03: rate limit — máx 10 diagnósticos por usuário por hora
  try {
    const rateLimitCount = await rateLimitStrict(`diagnostic:${user.id}`, 3600)
    if (rateLimitCount > 10) {
      logger.warn('diagnostic/run', 'rate limit atingido', { userId: user.id, count: rateLimitCount })
      return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
    }
  } catch {
    return NextResponse.json({ error: 'Serviço temporariamente indisponível. Tente novamente em instantes.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null)
  const profileId = body?.profileId
  if (!profileId || typeof profileId !== 'string') {
    return NextResponse.json({ error: 'profileId obrigatório' }, { status: 400 })
  }

  logger.info('diagnostic/run', 'iniciando diagnóstico', { userId: user.id, profileId })

  const serviceClient = await createServiceClient()

  // Busca o perfil e verifica que pertence ao usuário
  const { data: profile, error: profileError } = await serviceClient
    .from('gmb_profiles')
    .select('*')
    .eq('id', profileId)
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    logger.warn('diagnostic/run', 'perfil não encontrado', { userId: user.id, profileId })
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  // Busca dados do usuário para email
  const { data: userData } = await serviceClient
    .from('users')
    .select('email, name')
    .eq('id', user.id)
    .single()

  let accessToken: string | null = null
  try {
    accessToken = await getValidGmbToken(user.id)
  } catch (tokenErr) {
    logger.error('diagnostic/run', 'token GBP indisponível', { userId: user.id, error: String(tokenErr) })
  }

  // Sem token não é possível buscar dados reais do GBP.
  // Retorna erro para que o onboarding possa pedir reconexão.
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Sessão Google expirada. Faça login novamente para rodar o diagnóstico.' },
      { status: 401 }
    )
  }

  // Sincroniza reviews reais da GBP antes do diagnóstico (dados frescos)
  await syncProfileReviews(serviceClient, profileId, profile.google_location_id, accessToken)
    .catch(err => logger.warn('diagnostic/run', 'sync reviews falhou (não bloqueante)', { profileId, error: String(err) }))

  // Roda o diagnóstico com dados reais do GBP
  logger.info('diagnostic/run', 'chamando runDiagnosis', { profileId, locationId: profile.google_location_id })
  const result = await runDiagnosis(
    profile.google_location_id,
    profile.category ?? 'dentista',
    accessToken,
    serviceClient,
    profileId
  )

  const { score, aiDiagnosis, profileData } = result
  logger.info('diagnostic/run', 'diagnóstico concluído', { profileId, score: score.total })

  // Salva no banco (inclui snapshot dos dados reais para uso posterior em otimizações)
  const { data: diagnostic, error: saveError } = await serviceClient
    .from('diagnostics')
    .insert({
      profile_id: profileId,
      score_total: score.total,
      score_info_basica: score.categories.info.score,
      score_fotos: score.categories.photos.score,
      score_avaliacoes: score.categories.reviews.score,
      score_posts: score.categories.posts.score,
      score_servicos: score.categories.services.score,
      score_atributos: score.categories.attributes.score,
      issues: Object.values(score.categories).flatMap(c => c.issues),
      profile_snapshot: profileData,
    })
    .select()
    .single()

  if (saveError) {
    logger.error('diagnostic/run', 'erro ao salvar diagnóstico no banco', { profileId, error: saveError.message })
    return NextResponse.json({ error: 'Erro ao salvar diagnóstico' }, { status: 500 })
  }

  // Atualiza score no perfil
  await serviceClient
    .from('gmb_profiles')
    .update({ score: score.total, last_synced_at: new Date().toISOString() })
    .eq('id', profileId)

  // Envia email de notificação
  if (userData?.email) {
    await sendDiagnosticReadyEmail({
      to: userData.email,
      name: userData.name ?? 'Doutor(a)',
      profileName: profile.name,
      score: score.total,
    }).catch(err => logger.warn('diagnostic/run', 'email de diagnóstico falhou', { userId: user.id, error: String(err) }))
  }

  logger.info('diagnostic/run', 'diagnóstico salvo com sucesso', { diagnosticId: diagnostic.id, profileId, score: score.total })

  return NextResponse.json({
    diagnosticId: diagnostic.id,
    score: score.total,
    categories: score.categories,
    aiDiagnosis,
  })
}
