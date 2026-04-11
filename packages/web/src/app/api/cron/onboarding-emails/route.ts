import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendOnboardingDay1, sendOnboardingDay3, sendOnboardingDay7 } from '@/lib/email/onboarding'

// POST /api/cron/onboarding-emails
// Chamado diariamente pelo Vercel Cron.
// Verifica quem está no dia 1, 3 ou 7 desde gmb_connected e envia o e-mail certo.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient(
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
    console.error('[cron/onboarding] query error:', error)
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

    // Busca dados do usuário e perfil
    const { data: user } = await supabase.from('users').select('email, name').eq('id', event.user_id).single()
    const { data: profile } = await supabase.from('gmb_profiles').select('id, name, score').eq('user_id', event.user_id).order('created_at', { ascending: false }).limit(1).single()
    const { data: diagnostic } = profile
      ? await supabase.from('diagnostics').select('score_total').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(1).single()
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
      console.error(`[cron/onboarding] email error user=${event.user_id} day=${daysElapsed}:`, err)
      results.errors++
    }
  }

  console.log('[cron/onboarding] done:', results)
  return NextResponse.json({ ok: true, results })
}
