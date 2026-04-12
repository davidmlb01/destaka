// Compila dados do mês anterior para o relatório mensal
import type { SupabaseClient } from '@supabase/supabase-js'

export interface MonthlyReportData {
  user_name: string
  user_email: string
  profile_name: string
  segment: string
  month: number
  year: number
  month_label: string
  score_current: number
  score_previous: number
  score_delta: number
  avg_rating: number
  reviews_new_this_month: number
  reviews_total: number
  response_rate: number
  posts_published_this_month: number
  next_month_focus: string
  next_month_action: string
}

const MONTH_LABELS = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export async function compileMonthlyReport(
  db: SupabaseClient,
  userId: string
): Promise<MonthlyReportData | null> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const monthStart = new Date(year, now.getMonth() - 1, 1)
  const monthEnd = new Date(year, now.getMonth(), 0, 23, 59, 59)

  const { data: user } = await db.from('users').select('email, name').eq('id', userId).single()
  if (!user) return null

  const { data: profile } = await db
    .from('gmb_profiles')
    .select('id, name, category, score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (!profile) return null

  // Score atual e anterior
  const { data: scoreRows } = await db
    .from('score_history')
    .select('score, measured_at')
    .eq('profile_id', profile.id)
    .order('measured_at', { ascending: false })
    .limit(2)

  const scoreCurrent = scoreRows?.[0]?.score ?? profile.score ?? 0
  const scorePrevious = scoreRows?.[1]?.score ?? scoreCurrent
  const scoreDelta = scoreCurrent - scorePrevious

  // Reviews do mês
  const { data: allReviews } = await db
    .from('gmb_reviews')
    .select('id, rating, reply_status, created_at')
    .eq('profile_id', profile.id)

  const reviewsAll = allReviews ?? []
  const reviewsThisMonth = reviewsAll.filter(r => {
    const d = new Date(r.created_at)
    return d >= monthStart && d <= monthEnd
  })

  const avgRating = reviewsAll.length > 0
    ? reviewsAll.reduce((s, r) => s + r.rating, 0) / reviewsAll.length
    : 0

  const replied = reviewsAll.filter(r => r.reply_status === 'replied').length
  const responseRate = reviewsAll.length > 0 ? replied / reviewsAll.length : 0

  // Posts publicados no mês
  const { data: posts } = await db
    .from('gmb_posts')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('status', 'published')
    .gte('published_at', monthStart.toISOString())
    .lte('published_at', monthEnd.toISOString())

  // Foco do próximo mês
  const { focus, action } = nextMonthFocus(scoreCurrent, avgRating, responseRate, posts?.length ?? 0)

  return {
    user_name: user.name ?? user.email,
    user_email: user.email,
    profile_name: profile.name,
    segment: profile.category ?? 'profissional de saúde',
    month,
    year,
    month_label: MONTH_LABELS[month],
    score_current: scoreCurrent,
    score_previous: scorePrevious,
    score_delta: scoreDelta,
    avg_rating: parseFloat(avgRating.toFixed(1)),
    reviews_new_this_month: reviewsThisMonth.length,
    reviews_total: reviewsAll.length,
    response_rate: parseFloat(responseRate.toFixed(2)),
    posts_published_this_month: posts?.length ?? 0,
    next_month_focus: focus,
    next_month_action: action,
  }
}

function nextMonthFocus(
  score: number,
  avgRating: number,
  responseRate: number,
  postsCount: number
): { focus: string; action: string } {
  if (responseRate < 0.5) {
    return {
      focus: 'Responder todas as avaliações',
      action: 'Cada resposta conta como sinal de atividade para o Google. Vamos deixar a taxa acima de 80% no próximo mês.',
    }
  }
  if (postsCount < 4) {
    return {
      focus: 'Publicar pelo menos 4 posts',
      action: 'Perfis com posts regulares aparecem mais no Maps. O Destaka vai gerar e publicar automaticamente para você.',
    }
  }
  if (avgRating < 4.5) {
    return {
      focus: 'Pedir mais avaliações 5 estrelas',
      action: 'Enviar um link de avaliação para pacientes satisfeitos no dia seguinte à consulta pode subir sua nota média rapidamente.',
    }
  }
  if (score < 70) {
    return {
      focus: 'Completar o perfil no Google',
      action: `Faltam ${70 - score} pontos para Presença Forte. Adicionar fotos do espaço e serviços detalhados é o caminho mais rápido.`,
    }
  }
  return {
    focus: 'Manter a consistência',
    action: 'Seu perfil está bem posicionado. O objetivo agora é manter o ritmo de posts e respostas para consolidar a posição.',
  }
}
