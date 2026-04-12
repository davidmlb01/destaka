// Report Compiler — Story 008
// Compila dados dos últimos 30 dias para o relatório mensal

import { createClient as createAdminSupa, SupabaseClient } from '@supabase/supabase-js'

export interface MonthlyReportData {
  organization_id: string
  professional_name: string
  professional_email: string
  organization_name: string
  month: number
  year: number
  month_label: string

  // Score
  score_current: number
  score_previous: number
  score_delta: number
  score_faixa: string
  score_tendencia: string
  score_components: {
    gmb_completude: number
    reputacao: number
    visibilidade: number
    retencao: number
    conversao: number
  }

  // Reputação
  reviews_total: number
  reviews_new_this_month: number
  avg_rating: number
  response_rate: number

  // Posts
  posts_published_this_month: number

  // Foco do próximo mês
  next_month_focus: string
  next_month_action: string
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function nextMonthFocus(components: MonthlyReportData['score_components']): { focus: string; action: string } {
  const weights: Record<string, number> = {
    gmb_completude: 25,
    reputacao: 25,
    visibilidade: 20,
    retencao: 20,
    conversao: 10,
  }

  // Componente com maior gap relativo ao seu peso máximo
  let worstKey = 'gmb_completude'
  let worstGap = 0

  for (const [key, max] of Object.entries(weights)) {
    const current = components[key as keyof typeof components]
    const gap = max - current
    const relativeGap = gap / max
    if (relativeGap > worstGap) {
      worstGap = relativeGap
      worstKey = key
    }
  }

  const focusMap: Record<string, { focus: string; action: string }> = {
    gmb_completude: {
      focus: 'Completude do perfil Google',
      action: 'Adicione fotos, complete a descrição e configure todos os atributos do seu perfil.',
    },
    reputacao: {
      focus: 'Reputação e reviews',
      action: 'Peça avaliações aos pacientes satisfeitos e responda a todos os reviews pendentes.',
    },
    visibilidade: {
      focus: 'Visibilidade no Google Maps',
      action: 'Publique posts regulares e adicione categorias secundárias para aparecer em mais buscas.',
    },
    retencao: {
      focus: 'Retenção de pacientes',
      action: 'Importe sua lista de pacientes e ative lembretes de retorno para consultas preventivas.',
    },
    conversao: {
      focus: 'Conversão de visitas em contatos',
      action: 'Adicione botão de agendamento online e mantenha horários de atendimento atualizados.',
    },
  }

  return focusMap[worstKey] ?? focusMap.gmb_completude
}

export async function compileMonthlyReport(
  db: SupabaseClient,
  orgId: string
): Promise<MonthlyReportData | null> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sixtyDaysAgo = new Date(now)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  // Dados da organização e profissional
  const { data: org } = await db
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  const { data: professional } = await db
    .from('professionals')
    .select('name, email')
    .eq('organization_id', orgId)
    .eq('role', 'owner')
    .single()

  if (!org || !professional) return null

  // Scores
  const { data: scores } = await db
    .from('scores')
    .select('total, gmb_completude, reputacao, visibilidade, retencao, conversao, faixa, tendencia, snapshot_date')
    .eq('organization_id', orgId)
    .order('snapshot_date', { ascending: false })
    .limit(60)

  const scoreList = scores ?? []
  const latestScore = scoreList[0]
  const previousScore = scoreList.find(s => {
    const d = new Date(s.snapshot_date)
    return d < thirtyDaysAgo
  })

  const scoreCurrent = latestScore?.total ?? 0
  const scorePrevious = previousScore?.total ?? 0

  // Reviews
  const { data: allReviews } = await db
    .from('reviews')
    .select('rating, published_at')
    .eq('organization_id', orgId)

  const reviewList = allReviews ?? []
  const reviewsTotal = reviewList.length
  const reviewsNewThisMonth = reviewList.filter(r =>
    r.published_at && new Date(r.published_at) >= thirtyDaysAgo
  ).length

  const avgRating = reviewsTotal > 0
    ? reviewList.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewsTotal
    : 0

  // Taxa de resposta
  const { data: responses } = await db
    .from('review_responses')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'published')

  const responseRate = reviewsTotal > 0
    ? (responses?.length ?? 0) / reviewsTotal
    : 0

  // Posts publicados no mês
  const { data: posts } = await db
    .from('posts')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .gte('published_at', thirtyDaysAgo.toISOString())

  const postsPublished = posts?.length ?? 0

  const components = {
    gmb_completude: latestScore?.gmb_completude ?? 0,
    reputacao: latestScore?.reputacao ?? 0,
    visibilidade: latestScore?.visibilidade ?? 0,
    retencao: latestScore?.retencao ?? 0,
    conversao: latestScore?.conversao ?? 0,
  }

  const { focus, action } = nextMonthFocus(components)

  return {
    organization_id: orgId,
    professional_name: professional.name,
    professional_email: professional.email,
    organization_name: org.name,
    month,
    year,
    month_label: MONTH_NAMES[month - 1],
    score_current: scoreCurrent,
    score_previous: scorePrevious,
    score_delta: scoreCurrent - scorePrevious,
    score_faixa: latestScore?.faixa ?? 'fraca',
    score_tendencia: latestScore?.tendencia ?? 'estavel',
    score_components: components,
    reviews_total: reviewsTotal,
    reviews_new_this_month: reviewsNewThisMonth,
    avg_rating: parseFloat(avgRating.toFixed(1)),
    response_rate: parseFloat(responseRate.toFixed(2)),
    posts_published_this_month: postsPublished,
    next_month_focus: focus,
    next_month_action: action,
  }
}
