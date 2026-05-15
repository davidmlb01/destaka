import { NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { buildChecklist, projectedScore } from '@/lib/gmb/checklist'
import { trackEvent } from '@/lib/analytics'
import { rateLimit } from '@/lib/redis'

// GET /api/checklist
export async function GET() {
  const auth = await getAuthenticatedProfile('id')
  if (auth.error) return auth.error

  const count = await rateLimit(`checklist:${auth.user.id}`, 3600)
  if (count !== null && count > 120) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
  }

  const { user, profile, serviceClient } = auth

  // Evento de ativação: checklist_started (one-time)
  trackEvent(serviceClient, user.id, 'checklist_started', { profileId: profile.id })

  const { data: progress } = await serviceClient
    .from('checklist_progress')
    .select('item_key, done, done_at')
    .eq('profile_id', profile.id)

  const { data: diagnostic } = await serviceClient
    .from('diagnostics')
    .select('score_total')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const items = buildChecklist(progress ?? [])
  const currentScore = diagnostic?.score_total ?? 0
  const projected = projectedScore(items, currentScore)

  return NextResponse.json({
    items,
    currentScore,
    projectedScore: projected,
    doneCount: items.filter(i => i.done).length,
    totalCount: items.length,
  })
}
