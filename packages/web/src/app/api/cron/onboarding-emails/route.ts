import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOnboardingDay1, sendOnboardingDay3, sendOnboardingDay7 } from '@/lib/email/onboarding'
import { validateCronAuth } from '@/lib/cron-auth'
import { logger } from '@/lib/logger'

// POST /api/cron/onboarding-emails
// Chamado diariamente pelo Vercel Cron.
// Verifica quem está no dia 1, 3 ou 7 desde gmb_connected e envia o e-mail certo.
export async function POST(request: NextRequest) {
  const authError = validateCronAuth(request)
  if (authError) return authError

  const startedAt = Date.now()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()

  // Busca eventos gmb_connected nos últimos 8 dias (janela segura para dia 7)
  const since = new Date(now)
  since.setDate(since.getDate() - 8)

  const { data: events, error } = await supabase
    .from('user_events')
    .select('user_id, created_at')
    .eq('event_type', 'gmb_connected')
    .gte('created_at', since.toISOString())

  if (error) {
    logger.error('cron/onboarding-emails', 'erro na query de eventos', { err: error.message })
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const results = { day1: 0, day3: 0, day7: 0, skipped: 0, errors: 0 }

  for (const event of events ?? []) {
    const connectedAt = new Date(event.created_at)
    const daysElapsed = Math.floor((now.getTime() - connectedAt.getTime()) / (1000 * 60 * 60 * 24))

    if (![1, 3, 7].includes(daysElapsed)) {
      results.skipped++
      continue
    }

    // Busca dados do usuário e perfil (maybeSingle evita exceção se não encontrar)
    const { data: user } = await supabase.from('users').select('email, name').eq('id', event.user_id).maybeSingle()
    const { data: profile } = await supabase.from('gmb_profiles').select('id, name, score').eq('user_id', event.user_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const { data: diagnostic } = profile
      ? await supabase.from('diagnostics').select('score_total').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      : { data: null }

    if (!user?.email || !profile?.name) {
      results.skipped++
      continue
    }

    const firstName = (user.name ?? user.email).split(' ')[0]
    const score = diagnostic?.score_total ?? profile.score ?? 0

    try {
      if (daysElapsed === 1) {
        await sendOnboardingDay1({ to: user.email, name: firstName, profileName: profile.name })
        results.day1++
      } else if (daysElapsed === 3) {
        await sendOnboardingDay3({ to: user.email, name: firstName, profileName: profile.name, score })
        results.day3++
      } else if (daysElapsed === 7) {
        await sendOnboardingDay7({ to: user.email, name: firstName, profileName: profile.name, score })
        results.day7++
      }
    } catch (err) {
      logger.error('cron/onboarding-emails', 'erro ao enviar email', { userId: event.user_id, day: daysElapsed, err: String(err) })
      results.errors++
    }
  }

  logger.info('cron/onboarding-emails', 'concluído', { ...results, duration_ms: Date.now() - startedAt })
  return NextResponse.json({ ok: true, results })
}
