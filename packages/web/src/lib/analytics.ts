import type { SupabaseClient } from '@supabase/supabase-js'

export type EventType =
  | 'gmb_connected'
  | 'score_viewed'
  | 'first_optimization'
  | 'checklist_started'
  | 'plan_upgraded'
  | 'dashboard_visited'
  | 'review_responded'
  | 'post_published'

// Eventos que só disparam uma vez por usuário (activation funnel)
const ONE_TIME_EVENTS: EventType[] = [
  'gmb_connected',
  'score_viewed',
  'first_optimization',
  'checklist_started',
]

/**
 * Registra evento de ativação ou engajamento em user_events.
 * Fire-and-forget: erros são logados mas nunca propagados.
 * Eventos one-time só disparam uma vez por usuário.
 */
export async function trackEvent(
  client: SupabaseClient,
  userId: string,
  eventType: EventType,
  options?: {
    profileId?: string
    metadata?: Record<string, unknown>
  }
): Promise<void> {
  try {
    if (ONE_TIME_EVENTS.includes(eventType)) {
      const { count } = await client
        .from('user_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', eventType)

      if ((count ?? 0) > 0) return
    }

    await client.from('user_events').insert({
      user_id: userId,
      profile_id: options?.profileId ?? null,
      event_type: eventType,
      metadata: options?.metadata ?? {},
    })
  } catch (err) {
    console.error(`[analytics] trackEvent(${eventType}) error:`, err)
  }
}

/**
 * Registra score no histórico temporal (North Star Metric).
 * Fire-and-forget.
 */
export async function recordScore(
  client: SupabaseClient,
  profileId: string,
  score: number
): Promise<void> {
  try {
    await client.from('score_history').insert({
      profile_id: profileId,
      score,
      measured_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[analytics] recordScore error:', err)
  }
}

/**
 * Atualiza last_seen_at do usuário (churn prevention).
 * Fire-and-forget.
 */
export async function upsertSession(
  client: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    await client.from('user_sessions').upsert(
      {
        user_id: userId,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  } catch (err) {
    console.error('[analytics] upsertSession error:', err)
  }
}
