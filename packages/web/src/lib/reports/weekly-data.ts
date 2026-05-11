// =============================================================================
// DESTAKA — Compilador de dados do relatório semanal
// Agrega posts, reviews, score e alertas dos últimos 7 dias.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

export interface WeeklyReportData {
  user_name: string
  user_email: string
  profile_id: string
  profile_name: string

  // Posts
  posts_published: number
  posts_topics: string[]

  // Reviews
  reviews_replied: number
  reviews_auto_replied: number
  reviews_pending_approval: number

  // Score
  score_current: number
  score_previous: number
  score_delta: number

  // Alertas de perfil
  alerts_count: number
  alerts: Array<{ field: string; old_value: string | null; new_value: string | null }>
}

export async function buildWeeklyReportData(
  profileId: string,
  db: SupabaseClient
): Promise<WeeklyReportData | null> {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoISO = weekAgo.toISOString()

  // Perfil + usuário
  const { data: profile } = await db
    .from('gmb_profiles')
    .select('id, name, user_id, score')
    .eq('id', profileId)
    .single()

  if (!profile) return null

  const { data: user } = await db
    .from('users')
    .select('email, name')
    .eq('id', profile.user_id)
    .single()

  if (!user?.email) return null

  // Posts publicados na última semana
  const { data: posts } = await db
    .from('gmb_posts')
    .select('id, topic_type')
    .eq('profile_id', profileId)
    .eq('status', 'published')
    .gte('published_at', weekAgoISO)

  const postsPublished = posts?.length ?? 0
  const postsTopics = [...new Set((posts ?? []).map(p => p.topic_type).filter(Boolean))]

  // Reviews respondidos na última semana (reply_status = 'replied' e updated_at recente)
  const { data: repliedReviews } = await db
    .from('gmb_reviews')
    .select('id, reply_status')
    .eq('profile_id', profileId)
    .eq('reply_status', 'replied')
    .gte('updated_at', weekAgoISO)

  const reviewsReplied = repliedReviews?.length ?? 0

  // Reviews pendentes de aprovação (tem ai_reply_draft mas reply_status = 'pending')
  const { data: pendingApproval } = await db
    .from('gmb_reviews')
    .select('id')
    .eq('profile_id', profileId)
    .eq('reply_status', 'pending')
    .not('ai_reply_draft', 'is', null)

  const reviewsPendingApproval = pendingApproval?.length ?? 0

  // Score atual (último diagnóstico)
  const { data: latestDiag } = await db
    .from('diagnostics')
    .select('score_total, created_at')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const scoreCurrent = latestDiag?.score_total ?? profile.score ?? 0

  // Score de ~7 dias atrás (diagnóstico mais próximo dessa data)
  const { data: prevDiag } = await db
    .from('diagnostics')
    .select('score_total')
    .eq('profile_id', profileId)
    .lte('created_at', weekAgoISO)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const scorePrevious = prevDiag?.score_total ?? scoreCurrent
  const scoreDelta = scoreCurrent - scorePrevious

  // Alertas de perfil da semana
  const { data: alerts } = await db
    .from('profile_alerts')
    .select('field, old_value, new_value')
    .eq('profile_id', profileId)
    .gte('created_at', weekAgoISO)

  return {
    user_name: user.name ?? user.email,
    user_email: user.email,
    profile_id: profileId,
    profile_name: profile.name,
    posts_published: postsPublished,
    posts_topics: postsTopics,
    reviews_replied: reviewsReplied,
    reviews_auto_replied: reviewsReplied, // por enquanto equivalente
    reviews_pending_approval: reviewsPendingApproval,
    score_current: scoreCurrent,
    score_previous: scorePrevious,
    score_delta: scoreDelta,
    alerts_count: alerts?.length ?? 0,
    alerts: (alerts ?? []).map(a => ({
      field: a.field,
      old_value: a.old_value,
      new_value: a.new_value,
    })),
  }
}
