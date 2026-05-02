import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processReviewQueue } from '@/lib/gmb/review-automation'
import { validateCronAuth } from '@/lib/cron-auth'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { logger } from '@/lib/logger'

// POST /api/cron/review-monitor
// Vercel Cron: a cada 6 horas
// Gera rascunhos de resposta para reviews pendentes
export async function POST(request: NextRequest) {
  const authError = validateCronAuth(request)
  if (authError) return authError

  const startedAt = Date.now()
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Filtra apenas usuários pro — automação de reviews é feature paga
  const { data: proUsers } = await db.from('users').select('id').neq('plan', 'free')
  const proUserIds = (proUsers ?? []).map((u: { id: string }) => u.id)

  const { data: profiles, error: profilesError } = await db
    .from('gmb_profiles')
    .select('id, name, category, auto_post_mode, user_id')
    .in('user_id', proUserIds.length ? proUserIds : ['00000000-0000-0000-0000-000000000000'])

  if (profilesError) {
    console.error('[cron/review-monitor] profiles query error:', profilesError)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!profiles?.length) {
    console.log('[cron/review-monitor] no profiles found')
    return NextResponse.json({ ok: true, processed: 0 })
  }

  const results: Array<{ profileId: string; drafted: number; published: number; errors: number }> = []

  for (const profile of profiles) {
    const autoPublish = profile.auto_post_mode === 'automatic'

    // Obtém token do usuário — necessário para publicar respostas na GBP API
    let accessToken: string | null = null
    try {
      accessToken = await getValidGmbToken(profile.user_id)
    } catch (tokenErr) {
      logger.warn('cron/review-monitor', 'token expirado, processando apenas rascunhos', { userId: profile.user_id, profileId: profile.id, err: String(tokenErr) })
      // Continua sem token — processReviewQueue salvará como rascunho em vez de publicar
    }

    try {
      const stats = await processReviewQueue(
        db,
        profile.id,
        profile.category ?? 'profissional de saúde',
        profile.name,
        autoPublish,
        accessToken
      )
      results.push({ profileId: profile.id, ...stats })
    } catch (err) {
      logger.error('cron/review-monitor', 'erro ao processar reviews', { profileId: profile.id, err: String(err) })
      results.push({ profileId: profile.id, drafted: 0, published: 0, errors: 1 })
    }
  }

  const summary = {
    ok: true,
    duration_ms: Date.now() - startedAt,
    processed: results.length,
    total_drafted: results.reduce((s, r) => s + r.drafted, 0),
    total_published: results.reduce((s, r) => s + r.published, 0),
    total_errors: results.reduce((s, r) => s + r.errors, 0),
  }

  logger.info('cron/review-monitor', 'concluído', summary)
  return NextResponse.json(summary)
}
