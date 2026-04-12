// Score Destaka — Story 007
// Métrica unificada 0-100 com 5 componentes e pesos definidos no PRD

import type { ScoreFaixa, Tendencia } from '@/types'

export interface ScoreInput {
  // GMB Completude (25 pts)
  hasDescription: boolean
  categoryCount: number
  attributeCount: number
  photoCount: number
  hasHours: boolean
  recentPostCount: number  // posts nos últimos 30 dias

  // Reputação (25 pts)
  avgRating: number        // 0-5
  reviewCount: number
  reviewResponseRate: number  // 0-1 (proporção de reviews com resposta)
  reviewsLast30Days: number

  // Visibilidade (20 pts) — dados da GBP Insights API (opcional)
  profileViews?: number
  searchImpressions?: number

  // Retenção (20 pts) — dados do CSV de pacientes (opcional no MVP)
  returnPatientRate?: number  // 0-1

  // Conversão (10 pts) — dados da GBP Insights API (opcional)
  callClicks?: number
  directionRequests?: number
  websiteClicks?: number
}

export interface ScoreBreakdown {
  total: number
  gmb_completude: number
  reputacao: number
  visibilidade: number
  retencao: number
  conversao: number
  faixa: ScoreFaixa
  tendencia: Tendencia
  details: {
    gmb_completude: Record<string, number>
    reputacao: Record<string, number>
    visibilidade: Record<string, number>
    retencao: Record<string, number>
    conversao: Record<string, number>
  }
}

// ─── GMB Completude (max 25 pts) ──────────────────────────────────────────────

function calcGmbCompletude(input: ScoreInput): { score: number; details: Record<string, number> } {
  const d: Record<string, number> = {}

  // Descrição (6 pts)
  d.descricao = input.hasDescription ? 6 : 0

  // Categorias (5 pts) — 1 categoria = 1pt, 2 = 3pt, 3+ = 5pt
  d.categorias = input.categoryCount >= 3 ? 5 : input.categoryCount === 2 ? 3 : input.categoryCount === 1 ? 1 : 0

  // Atributos (4 pts) — 5+ atributos = max
  d.atributos = Math.min(4, Math.round((input.attributeCount / 5) * 4))

  // Fotos (5 pts) — 10+ fotos = max
  d.fotos = Math.min(5, Math.round((input.photoCount / 10) * 5))

  // Horários (3 pts)
  d.horarios = input.hasHours ? 3 : 0

  // Posts recentes (2 pts) — 2+ posts em 30 dias = max
  d.posts_recentes = input.recentPostCount >= 2 ? 2 : input.recentPostCount === 1 ? 1 : 0

  const score = Object.values(d).reduce((a, b) => a + b, 0)
  return { score: Math.min(25, score), details: d }
}

// ─── Reputação (max 25 pts) ───────────────────────────────────────────────────

function calcReputacao(input: ScoreInput): { score: number; details: Record<string, number> } {
  const d: Record<string, number> = {}

  // Média de estrelas (10 pts) — 4.5+ = max
  if (input.avgRating >= 4.5) d.avg_rating = 10
  else if (input.avgRating >= 4.0) d.avg_rating = 8
  else if (input.avgRating >= 3.5) d.avg_rating = 5
  else if (input.avgRating >= 3.0) d.avg_rating = 3
  else d.avg_rating = 0

  // Volume de reviews (8 pts) — 50+ reviews = max
  d.volume_reviews = Math.min(8, Math.round((input.reviewCount / 50) * 8))

  // Taxa de resposta (5 pts) — 80%+ = max
  d.taxa_resposta = input.reviewResponseRate >= 0.8 ? 5
    : input.reviewResponseRate >= 0.5 ? 3
    : input.reviewResponseRate >= 0.2 ? 1
    : 0

  // Velocidade de reviews (2 pts) — 2+ reviews no mês = max
  d.velocidade = input.reviewsLast30Days >= 2 ? 2 : input.reviewsLast30Days >= 1 ? 1 : 0

  const score = Object.values(d).reduce((a, b) => a + b, 0)
  return { score: Math.min(25, score), details: d }
}

// ─── Visibilidade (max 20 pts) ────────────────────────────────────────────────

function calcVisibilidade(input: ScoreInput): { score: number; details: Record<string, number> } {
  const d: Record<string, number> = {}

  if (input.profileViews !== undefined || input.searchImpressions !== undefined) {
    // Dados reais da GBP Insights
    d.visualizacoes = Math.min(12, Math.round(((input.profileViews ?? 0) / 500) * 12))
    d.impressoes = Math.min(8, Math.round(((input.searchImpressions ?? 0) / 1000) * 8))
  } else {
    // Sem dados de insights: estima pela completude do perfil (proxy)
    // Perfil completo tende a ter melhor visibilidade
    const profileScore = calcGmbCompletude(input).score
    d.estimativa = Math.round((profileScore / 25) * 12)  // max 12 pts por estimativa
    d.sem_dados = 0
  }

  const score = Object.values(d).reduce((a, b) => a + b, 0)
  return { score: Math.min(20, score), details: d }
}

// ─── Retenção (max 20 pts) ────────────────────────────────────────────────────

function calcRetencao(input: ScoreInput): { score: number; details: Record<string, number> } {
  const d: Record<string, number> = {}

  if (input.returnPatientRate !== undefined) {
    // Dados reais do CSV — 60%+ retorno = max
    d.taxa_retorno = Math.min(20, Math.round(input.returnPatientRate * 20))
  } else {
    // MVP sem CSV: pontuação base mínima garantida (não penaliza quem não importou)
    d.base_mvp = 8
  }

  const score = Object.values(d).reduce((a, b) => a + b, 0)
  return { score: Math.min(20, score), details: d }
}

// ─── Conversão (max 10 pts) ───────────────────────────────────────────────────

function calcConversao(input: ScoreInput): { score: number; details: Record<string, number> } {
  const d: Record<string, number> = {}

  if (
    input.callClicks !== undefined ||
    input.directionRequests !== undefined ||
    input.websiteClicks !== undefined
  ) {
    const totalActions = (input.callClicks ?? 0) + (input.directionRequests ?? 0) + (input.websiteClicks ?? 0)
    d.acoes = Math.min(10, Math.round((totalActions / 100) * 10))
  } else {
    // Sem dados de insights: estima pela reputação (proxy de conversão)
    const repScore = calcReputacao(input).score
    d.estimativa = Math.round((repScore / 25) * 6)  // max 6 pts por estimativa
  }

  const score = Object.values(d).reduce((a, b) => a + b, 0)
  return { score: Math.min(10, score), details: d }
}

// ─── Score total ──────────────────────────────────────────────────────────────

export function calculateScore(
  input: ScoreInput,
  previousScores: number[] = []
): ScoreBreakdown {
  const gmb = calcGmbCompletude(input)
  const rep = calcReputacao(input)
  const vis = calcVisibilidade(input)
  const ret = calcRetencao(input)
  const conv = calcConversao(input)

  const total = gmb.score + rep.score + vis.score + ret.score + conv.score

  const faixa: ScoreFaixa =
    total >= 90 ? 'perfeita'
    : total >= 70 ? 'forte'
    : total >= 40 ? 'funcional'
    : 'fraca'

  // Tendência: média dos últimos 7 snapshots vs atual
  let tendencia: Tendencia = 'estavel'
  if (previousScores.length >= 3) {
    const recent = previousScores.slice(-7)
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length
    if (total > avg + 2) tendencia = 'melhorando'
    else if (total < avg - 2) tendencia = 'declinando'
  }

  return {
    total,
    gmb_completude: gmb.score,
    reputacao: rep.score,
    visibilidade: vis.score,
    retencao: ret.score,
    conversao: conv.score,
    faixa,
    tendencia,
    details: {
      gmb_completude: gmb.details,
      reputacao: rep.details,
      visibilidade: vis.details,
      retencao: ret.details,
      conversao: conv.details,
    },
  }
}

// Monta ScoreInput a partir dos dados do banco
export function buildScoreInput(params: {
  profile: {
    description?: string | null
    categories?: string[]
    attributes?: unknown[]
    photo_count?: number
    hours?: unknown
  }
  reviewCount: number
  avgRating: number
  responseRate: number
  reviewsLast30Days: number
  recentPostCount: number
}): ScoreInput {
  const { profile, reviewCount, avgRating, responseRate, reviewsLast30Days, recentPostCount } = params
  return {
    hasDescription: !!(profile.description?.trim()),
    categoryCount: profile.categories?.length ?? 0,
    attributeCount: Array.isArray(profile.attributes) ? profile.attributes.length : 0,
    photoCount: profile.photo_count ?? 0,
    hasHours: !!profile.hours,
    recentPostCount,
    avgRating,
    reviewCount,
    reviewResponseRate: responseRate,
    reviewsLast30Days,
  }
}
