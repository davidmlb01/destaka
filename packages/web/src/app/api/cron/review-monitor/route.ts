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

  const { data: profiles, error: profilesError } = await db
    .from('gmb_profiles')
    .select('id, name, category, auto_post_mode, user_id')

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

    // Valida token do usuário antes de processar reviews
    try {
      await getValidGmbToken(profile.user_id)
    } catch (tokenErr) {
      logger.warn('cron/review-monitor', 'token expirado', { userId: profile.user_id, profileId: profile.id, err: String(tokenErr) })
      results.push({ profileId: profile.id, drafted: 0, published: 0, errors: 1 })
      continue
    }

    try {
      const stats = await processReviewQueue(
        db,
        profile.id,
        profile.category ?? 'profissional de saúde',
        profile.name,
        autoPublish
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
