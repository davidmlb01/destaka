// Motor de Ranking: Camada 1.4 - Gap Analysis
// Compara o perfil do usuário com o 1o colocado para cada keyword.
// Identifica exatamente o que falta para subir.

import { getPlaceDetails } from '@/lib/places/client'
import type { PlaceDetails } from '@/lib/places/client'

export interface GapFactor {
  factor: string
  label: string
  userValue: number | string
  competitorValue: number | string
  status: 'ahead' | 'behind' | 'tied'
  impact: 'high' | 'medium' | 'low'
  action: string
}

export interface GapAnalysis {
  competitorName: string
  competitorPlaceId: string
  keyword: string
  factors: GapFactor[]
  summary: string
  userPosition: number | null
}

export async function analyzeGap(
  userProfile: {
    name: string
    rating: number
    reviewCount: number
    photoCount: number
    hasWebsite: boolean
    hasPhone: boolean
    hasHours: boolean
    recentPostCount: number
    responseRate: number
  },
  competitorPlaceId: string,
  keyword: string,
  userPosition: number | null
): Promise<GapAnalysis | null> {
  const competitor = await getPlaceDetails(competitorPlaceId)
  if (!competitor) return null

  const factors: GapFactor[] = []

  // 1. Reviews (impacto alto)
  const reviewGap = (competitor.user_ratings_total ?? 0) - userProfile.reviewCount
  factors.push({
    factor: 'reviews',
    label: 'Avaliações',
    userValue: userProfile.reviewCount,
    competitorValue: competitor.user_ratings_total ?? 0,
    status: reviewGap > 0 ? 'behind' : reviewGap < 0 ? 'ahead' : 'tied',
    impact: 'high',
    action: reviewGap > 0
      ? `Faltam ${reviewGap} avaliações para empatar. Peça a 5 pacientes por semana.`
      : 'Você tem mais avaliações. Continue pedindo para manter a vantagem.',
  })

  // 2. Rating (impacto alto)
  const ratingDiff = userProfile.rating - (competitor.rating ?? 0)
  factors.push({
    factor: 'rating',
    label: 'Nota média',
    userValue: userProfile.rating.toFixed(1),
    competitorValue: (competitor.rating ?? 0).toFixed(1),
    status: ratingDiff > 0 ? 'ahead' : ratingDiff < 0 ? 'behind' : 'tied',
    impact: 'high',
    action: ratingDiff >= 0
      ? 'Sua nota é igual ou superior. Responda todas as avaliações para mantê-la.'
      : 'Responda avaliações negativas com empatia. Cada 5 estrelas sobe a média.',
  })

  // 3. Fotos (impacto médio)
  const compPhotos = competitor.photos?.length ?? 0
  const photoGap = compPhotos - userProfile.photoCount
  factors.push({
    factor: 'photos',
    label: 'Fotos',
    userValue: userProfile.photoCount,
    competitorValue: compPhotos,
    status: photoGap > 0 ? 'behind' : photoGap < 0 ? 'ahead' : 'tied',
    impact: 'medium',
    action: photoGap > 0
      ? `Adicione ${Math.min(photoGap, 5)} fotos novas do consultório, equipe ou atendimento.`
      : 'Você tem mais fotos. Adicione novas mensalmente para manter atividade.',
  })

  // 4. Website (impacto médio)
  const compHasWebsite = !!competitor.website
  factors.push({
    factor: 'website',
    label: 'Website',
    userValue: userProfile.hasWebsite ? 'Sim' : 'Não',
    competitorValue: compHasWebsite ? 'Sim' : 'Não',
    status: userProfile.hasWebsite === compHasWebsite ? 'tied' : userProfile.hasWebsite ? 'ahead' : 'behind',
    impact: 'medium',
    action: !userProfile.hasWebsite ? 'Vincule seu site ao perfil do Google.' : 'Website vinculado.',
  })

  // 5. Resposta a reviews (impacto alto)
  factors.push({
    factor: 'response_rate',
    label: 'Respostas às avaliações',
    userValue: `${Math.round(userProfile.responseRate * 100)}%`,
    competitorValue: 'N/A',
    status: userProfile.responseRate >= 0.9 ? 'ahead' : 'behind',
    impact: 'high',
    action: userProfile.responseRate < 0.9
      ? 'O Destaka está respondendo automaticamente. Meta: 100% em até 48h.'
      : 'Excelente taxa de resposta. Continue assim.',
  })

  // 6. Posts recentes (impacto médio)
  factors.push({
    factor: 'posts',
    label: 'Posts recentes (30 dias)',
    userValue: userProfile.recentPostCount,
    competitorValue: 'N/A',
    status: userProfile.recentPostCount >= 4 ? 'ahead' : 'behind',
    impact: 'medium',
    action: userProfile.recentPostCount < 4
      ? 'O Destaka publica automaticamente. Meta: 4+ posts por mês.'
      : 'Frequência de posts adequada.',
  })

  // Resumo
  const behind = factors.filter(f => f.status === 'behind')
  const ahead = factors.filter(f => f.status === 'ahead')

  let summary: string
  if (behind.length === 0) {
    summary = `Você está à frente do ${competitor.name} em todos os fatores analisados. Continue o ritmo para consolidar a 1ª posição.`
  } else if (behind.length <= 2) {
    summary = `Você está perto de ultrapassar ${competitor.name}. Foco em: ${behind.map(f => f.label.toLowerCase()).join(' e ')}.`
  } else {
    summary = `Para alcançar ${competitor.name}, priorize: ${behind.filter(f => f.impact === 'high').map(f => f.label.toLowerCase()).join(', ')}.`
  }

  return {
    competitorName: competitor.name,
    competitorPlaceId: competitorPlaceId,
    keyword,
    factors,
    summary,
    userPosition,
  }
}
