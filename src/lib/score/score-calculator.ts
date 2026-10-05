// Score Destaka — Story 007 (rebalanceado DESTAKA-004-01)
// Metrica unificada 0-100 com 5 componentes e pesos revisados:
//   Completude GMB: 40%  |  Reputacao: 20%  |  Alcance geo: 15%
//   Keywords/visibilidade: 15%  |  Conteudo (posts): 10%

import type { ScoreFaixa, Tendencia } from '@/types'

export interface ScoreInput {
  // GMB Completude (40 pts)
  hasDescription: boolean
  categoryCount: number
  attributeCount: number
  photoCount: number
  hasHours: boolean
  hasWebsite: boolean

  // Reputacao (20 pts)
  avgRating: number        // 0-5
  reviewCount: number
  reviewResponseRate: number  // 0-1 (proporcao de reviews com resposta)
  reviewsLast30Days: number

  // Alcance geografico (15 pts)
  geoStrongZones: number   // zonas com status 'strong'
  geoTotalZones: number    // total de zonas no snapshot

  // Keywords/visibilidade (15 pts)
  totalImpressions: number   // soma de impressoes da semana mais recente
  estimatedAvgImpressions: number // media estimada por categoria (benchmark)

  // Conteudo / Posts (10 pts)
  recentPostCount: number  // posts nos ultimos 30 dias
}

export interface ScoreBreakdown {
  total: number
  projected_score: number
  gmb_completude: number
  reputacao: number
  alcance_geo: number
  keywords: number
  conteudo: number
  faixa: ScoreFaixa
  tendencia: Tendencia
  details: {
    gmb_completude: Record<string, number>
    reputacao: Record<string, number>
    alcance_geo: Record<string, number>
    keywords: Record<string, number>
    conteudo: Record<string, number>
  }
  // Gaps que o Destaka resolve automaticamente, com impacto projetado
  auto_gaps: Array<{ field: string; impact: number; message: string }>
}

// Manter compatibilidade: campos antigos mapeados para persistencia
export interface ScoreBreakdownLegacy {
  total: number
  projected_score: number
  gmb_completude: number
  reputacao: number
  visibilidade: number   // = keywords (compatibilidade com coluna existente)
  retencao: number       // = alcance_geo (compatibilidade com coluna existente)
  conversao: number      // = conteudo (compatibilidade com coluna existente)
  faixa: ScoreFaixa
  tendencia: Tendencia
}

// ─── GMB Completude (max 40 pts) ──────────────────────────────────────────────

function calcGmbCompletude(input: ScoreInput): { score: number; details: Record<string, number> } {
  const d: Record<string, number> = {}

  // Descricao (10 pts)
  d.descricao = input.hasDescription ? 10 : 0

  // Categorias (8 pts) : 1=2, 2=5, 3+=8
  d.categorias = input.categoryCount >= 3 ? 8 : input.categoryCount === 2 ? 5 : input.categoryCount === 1 ? 2 : 0

  // Atributos (6 pts) : 5+ atributos = max
  d.atributos = Math.min(6, Math.round((input.attributeCount / 5) * 6))

  // Fotos (8 pts) : 10+ fotos = max
  d.fotos = Math.min(8, Math.round((input.photoCount / 10) * 8))

  // Horarios (4 pts)
  d.horarios = input.hasHours ? 4 : 0

  // Website (4 pts)
  d.website = input.hasWebsite ? 4 : 0

  const score = Object.values(d).reduce((a, b) => a + b, 0)
  return { score: Math.min(40, score), details: d }
}

// ─── Reputacao (max 20 pts) ───────────────────────────────────────────────────

function calcReputacao(input: ScoreInput): { score: number; details: Record<string, number> } {
  const d: Record<string, number> = {}

  // Media de estrelas (8 pts) : 4.5+ = max
  if (input.avgRating >= 4.5) d.avg_rating = 8
  else if (input.avgRating >= 4.0) d.avg_rating = 6
  else if (input.avgRating >= 3.5) d.avg_rating = 4
  else if (input.avgRating >= 3.0) d.avg_rating = 2
  else d.avg_rating = 0

  // Volume de reviews (6 pts) : 50+ reviews = max
  d.volume_reviews = Math.min(6, Math.round((input.reviewCount / 50) * 6))

  // Taxa de resposta (4 pts) : 80%+ = max
  d.taxa_resposta = input.reviewResponseRate >= 0.8 ? 4
    : input.reviewResponseRate >= 0.5 ? 2
    : input.reviewResponseRate >= 0.2 ? 1
    : 0

  // Velocidade de reviews (2 pts) : 2+ reviews no mes = max
  d.velocidade = input.reviewsLast30Days >= 2 ? 2 : input.reviewsLast30Days >= 1 ? 1 : 0

  const score = Object.values(d).reduce((a, b) => a + b, 0)
  return { score: Math.min(20, score), details: d }
}

// ─── Alcance Geografico (max 15 pts) ──────────────────────────────────────────

function calcAlcanceGeo(input: ScoreInput): { score: number; details: Record<string, number> } {
  const d: Record<string, number> = {}

  if (input.geoTotalZones > 0) {
    const ratio = input.geoStrongZones / input.geoTotalZones

    // Cobertura forte (10 pts) : 80%+ zonas strong = max
    d.cobertura_forte = Math.min(10, Math.round(ratio * 10))

    // Volume de zonas (5 pts) : 10+ zonas = max
    d.volume_zonas = Math.min(5, Math.round((input.geoTotalZones / 10) * 5))
  } else {
    // Sem dados geo: pontuacao base minima (nao penaliza antes do primeiro snapshot)
    d.sem_dados = 5
  }

  const score = Object.values(d).reduce((a, b) => a + b, 0)
  return { score: Math.min(15, score), details: d }
}

// ─── Keywords / Visibilidade (max 15 pts) ─────────────────────────────────────

function calcKeywords(input: ScoreInput): { score: number; details: Record<string, number> } {
  const d: Record<string, number> = {}

  if (input.totalImpressions > 0 || input.estimatedAvgImpressions > 0) {
    const benchmark = input.estimatedAvgImpressions > 0 ? input.estimatedAvgImpressions : 500

    // Impressoes vs benchmark (10 pts) : 100%+ do benchmark = max
    const ratio = input.totalImpressions / benchmark
    d.impressoes_vs_media = Math.min(10, Math.round(ratio * 10))

    // Volume absoluto (5 pts) : 1000+ impressoes = max
    d.volume_absoluto = Math.min(5, Math.round((input.totalImpressions / 1000) * 5))
  } else {
    // Sem dados de keywords: pontuacao base minima
    d.sem_dados = 5
  }

  const score = Object.values(d).reduce((a, b) => a + b, 0)
  return { score: Math.min(15, score), details: d }
}

// ─── Conteudo / Posts (max 10 pts) ────────────────────────────────────────────

function calcConteudo(input: ScoreInput): { score: number; details: Record<string, number> } {
  const d: Record<string, number> = {}

  // Posts recentes (6 pts) : 4+ posts em 30 dias = max
  if (input.recentPostCount >= 4) d.frequencia = 6
  else if (input.recentPostCount >= 2) d.frequencia = 4
  else if (input.recentPostCount >= 1) d.frequencia = 2
  else d.frequencia = 0

  // Consistencia (4 pts) : pelo menos 1 post = ativo
  d.ativo = input.recentPostCount > 0 ? 4 : 0

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
  const geo = calcAlcanceGeo(input)
  const kw = calcKeywords(input)
  const cont = calcConteudo(input)

  const total = gmb.score + rep.score + geo.score + kw.score + cont.score

  const faixa: ScoreFaixa =
    total >= 90 ? 'perfeita'
    : total >= 70 ? 'forte'
    : total >= 40 ? 'funcional'
    : 'fraca'

  // Tendencia: media dos ultimos 7 snapshots vs atual
  let tendencia: Tendencia = 'estavel'
  if (previousScores.length >= 3) {
    const recent = previousScores.slice(-7)
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length
    if (total > avg + 2) tendencia = 'melhorando'
    else if (total < avg - 2) tendencia = 'declinando'
  }

  // Calcula gaps que o Destaka resolve automaticamente
  const auto_gaps = buildAutoGaps(input, gmb, rep, cont)

  // Score projetado = atual + soma dos impactos dos gaps automatizaveis
  const projected_score = Math.min(100, total + auto_gaps.reduce((sum, g) => sum + g.impact, 0))

  return {
    total,
    projected_score,
    gmb_completude: gmb.score,
    reputacao: rep.score,
    alcance_geo: geo.score,
    keywords: kw.score,
    conteudo: cont.score,
    faixa,
    tendencia,
    details: {
      gmb_completude: gmb.details,
      reputacao: rep.details,
      alcance_geo: geo.details,
      keywords: kw.details,
      conteudo: cont.details,
    },
    auto_gaps,
  }
}

// ─── Gaps automatizaveis pelo Destaka ─────────────────────────────────────────

function buildAutoGaps(
  input: ScoreInput,
  gmb: { score: number; details: Record<string, number> },
  rep: { score: number; details: Record<string, number> },
  cont: { score: number; details: Record<string, number> },
): Array<{ field: string; impact: number; message: string }> {
  const gaps: Array<{ field: string; impact: number; message: string }> = []

  // Destaka gera descricao otimizada com IA
  if (!input.hasDescription) {
    gaps.push({ field: 'descricao', impact: 10, message: 'Destaka gera descricao otimizada com IA' })
  }

  // Destaka gera posts automaticos semanais
  if (input.recentPostCount < 2) {
    const potentialGain = cont.details.frequencia !== undefined ? (4 - cont.details.frequencia) : 4
    gaps.push({ field: 'posts', impact: Math.max(0, potentialGain), message: 'Posts automaticos semanais com IA' })
  }

  // Destaka responde reviews automaticamente
  if (input.reviewResponseRate < 0.8) {
    const currentPts = rep.details.taxa_resposta ?? 0
    gaps.push({ field: 'respostas_reviews', impact: Math.max(0, 4 - currentPts), message: 'Respostas automaticas para avaliacoes' })
  }

  // Destaka sugere atributos faltantes
  if (input.attributeCount < 5) {
    const currentPts = gmb.details.atributos ?? 0
    gaps.push({ field: 'atributos', impact: Math.max(0, 6 - currentPts), message: 'Sugestao automatica de atributos relevantes' })
  }

  return gaps.filter(g => g.impact > 0)
}

// ─── Converter para formato de persistencia (colunas legadas) ─────────────────

export function toLegacyBreakdown(b: ScoreBreakdown): ScoreBreakdownLegacy {
  return {
    total: b.total,
    projected_score: b.projected_score,
    gmb_completude: b.gmb_completude,
    reputacao: b.reputacao,
    visibilidade: b.keywords,       // coluna 'visibilidade' persiste keywords
    retencao: b.alcance_geo,        // coluna 'retencao' persiste alcance_geo
    conversao: b.conteudo,          // coluna 'conversao' persiste conteudo
    faixa: b.faixa,
    tendencia: b.tendencia,
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
    website?: string | null
  }
  reviewCount: number
  avgRating: number
  responseRate: number
  reviewsLast30Days: number
  recentPostCount: number
  geoStrongZones?: number
  geoTotalZones?: number
  totalImpressions?: number
  estimatedAvgImpressions?: number
}): ScoreInput {
  const { profile, reviewCount, avgRating, responseRate, reviewsLast30Days, recentPostCount } = params
  return {
    hasDescription: !!(profile.description?.trim()),
    categoryCount: profile.categories?.length ?? 0,
    attributeCount: Array.isArray(profile.attributes) ? profile.attributes.length : 0,
    photoCount: profile.photo_count ?? 0,
    hasHours: !!profile.hours,
    hasWebsite: !!(profile.website?.trim()),
    recentPostCount,
    avgRating,
    reviewCount,
    reviewResponseRate: responseRate,
    reviewsLast30Days,
    geoStrongZones: params.geoStrongZones ?? 0,
    geoTotalZones: params.geoTotalZones ?? 0,
    totalImpressions: params.totalImpressions ?? 0,
    estimatedAvgImpressions: params.estimatedAvgImpressions ?? 500,
  }
}
