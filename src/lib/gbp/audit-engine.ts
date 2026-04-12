// GBP Audit Engine — Story 002
// Analisa o perfil GBP do profissional e gera relatório de gaps via Claude

import { generateContent } from '@/lib/ai/client'
import type { GBPLocation, GBPReview, GBPMediaItem } from '@/lib/google/gbp-client'

export interface AuditInput {
  location: GBPLocation
  reviews: GBPReview[]
  media: GBPMediaItem[]
  specialty: string
  competitors?: GBPLocation[]
}

export interface AuditGap {
  dimension: 'categorias' | 'atributos' | 'servicos' | 'descricao' | 'fotos' | 'avaliacoes'
  severity: 'critico' | 'importante' | 'sugestao'
  title: string
  description: string
  action: string
  estimated_impact: number // pontos no score (0-10)
}

export interface AuditReport {
  location_name: string
  audited_at: string
  summary: string
  gaps: AuditGap[]
  photo_count: number
  avg_rating: number
  review_count: number
  has_description: boolean
  category_count: number
  attribute_count: number
  service_count: number
}

export async function runAudit(input: AuditInput): Promise<AuditReport> {
  const { location, reviews, media, specialty, competitors = [] } = input

  const photoCount = media.length
  const reviewCount = reviews.length
  const avgRating = reviewCount > 0
    ? reviews.reduce((sum, r) => {
        const map: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }
        return sum + (map[r.starRating] ?? 0)
      }, 0) / reviewCount
    : 0

  const hasDescription = !!(location.profile?.description?.trim())
  const categoryCount = 1 + (location.categories?.additionalCategories?.length ?? 0)
  const attributeCount = location.attributes?.length ?? 0
  const serviceCount = location.serviceItems?.length ?? 0

  // Monta prompt para Claude analisar o perfil
  const locationSummary = JSON.stringify({
    nome: location.title,
    especialidade: specialty,
    categorias: {
      principal: location.categories?.primaryCategory?.displayName,
      adicionais: location.categories?.additionalCategories?.map(c => c.displayName) ?? [],
    },
    descricao: location.profile?.description ?? '(sem descrição)',
    atributos: location.attributes?.map(a => a.name) ?? [],
    servicos: location.serviceItems?.map(s =>
      s.freeFormServiceItem?.label?.displayName ??
      s.structuredServiceItem?.serviceTypeId ?? 'serviço'
    ) ?? [],
    fotos: photoCount,
    avaliacoes: { total: reviewCount, media: avgRating.toFixed(1) },
  }, null, 2)

  const competitorsSummary = competitors.length > 0
    ? competitors.map(c => JSON.stringify({
        nome: c.title,
        categorias: (c.categories?.additionalCategories?.length ?? 0) + 1,
        descricao: c.profile?.description ? 'sim' : 'não',
        atributos: c.attributes?.length ?? 0,
        servicos: c.serviceItems?.length ?? 0,
      })).join('\n')
    : '(sem dados de concorrentes ainda)'

  const prompt = `Você é um especialista em SEO local para profissionais de saúde no Brasil.

PERFIL DO PROFISSIONAL:
${locationSummary}

CONCORRENTES (top 3):
${competitorsSummary}

Analise o perfil e identifique gaps de otimização. Para cada gap encontrado, forneça um JSON array com a estrutura:
{
  "dimension": "categorias|atributos|servicos|descricao|fotos|avaliacoes",
  "severity": "critico|importante|sugestao",
  "title": "título curto do problema",
  "description": "explicação clara para o profissional de saúde (sem jargão técnico)",
  "action": "ação específica e concreta para corrigir",
  "estimated_impact": número de 1 a 10
}

Foque nos gaps com maior impacto no Google Maps. Seja específico. Retorne APENAS o JSON array, sem texto adicional.`

  let gaps: AuditGap[] = []
  let summary = ''

  try {
    const systemPrompt = `Você é um especialista em Google Business Profile e SEO local para clínicas e consultórios de saúde no Brasil. Responda sempre em português brasileiro. Retorne apenas JSON válido quando solicitado.`

    const rawGaps = await generateContent(prompt, systemPrompt)
    const jsonMatch = rawGaps.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      gaps = JSON.parse(jsonMatch[0]) as AuditGap[]
    }
  } catch {
    // Fallback: gaps básicos baseados em regras
    gaps = generateRuleBasedGaps({ hasDescription, photoCount, categoryCount, attributeCount, serviceCount, reviewCount })
  }

  // Gera resumo
  const critical = gaps.filter(g => g.severity === 'critico').length
  const important = gaps.filter(g => g.severity === 'importante').length

  if (critical > 0) {
    summary = `${critical} problema${critical > 1 ? 's críticos' : ' crítico'} identificado${critical > 1 ? 's' : ''} que reduzem sua visibilidade no Google.`
  } else if (important > 0) {
    summary = `${important} melhoria${important > 1 ? 's importantes' : ' importante'} podem aumentar suas visitas no Google Maps.`
  } else {
    summary = 'Perfil bem otimizado. Pequenos ajustes podem melhorar ainda mais sua posição.'
  }

  return {
    location_name: location.title ?? location.name,
    audited_at: new Date().toISOString(),
    summary,
    gaps,
    photo_count: photoCount,
    avg_rating: parseFloat(avgRating.toFixed(2)),
    review_count: reviewCount,
    has_description: hasDescription,
    category_count: categoryCount,
    attribute_count: attributeCount,
    service_count: serviceCount,
  }
}

function generateRuleBasedGaps(data: {
  hasDescription: boolean
  photoCount: number
  categoryCount: number
  attributeCount: number
  serviceCount: number
  reviewCount: number
}): AuditGap[] {
  const gaps: AuditGap[] = []

  if (!data.hasDescription) {
    gaps.push({
      dimension: 'descricao',
      severity: 'critico',
      title: 'Sem descrição no perfil',
      description: 'Seu consultório não tem descrição. O Google usa esse texto para aparecer em buscas relevantes.',
      action: 'Adicione uma descrição de 250-750 caracteres com sua especialidade, diferenciais e localização.',
      estimated_impact: 8,
    })
  }

  if (data.photoCount < 10) {
    gaps.push({
      dimension: 'fotos',
      severity: data.photoCount < 3 ? 'critico' : 'importante',
      title: `Poucas fotos (${data.photoCount})`,
      description: 'Consultórios com mais fotos recebem mais cliques. O ideal é ter pelo menos 10 fotos.',
      action: 'Adicione fotos da fachada, recepção, sala de atendimento e equipe.',
      estimated_impact: 7,
    })
  }

  if (data.categoryCount < 3) {
    gaps.push({
      dimension: 'categorias',
      severity: 'importante',
      title: 'Poucas categorias',
      description: 'Adicionar categorias secundárias aumenta sua visibilidade em mais tipos de busca.',
      action: 'Adicione categorias secundárias relacionadas à sua especialidade.',
      estimated_impact: 6,
    })
  }

  if (data.serviceCount < 3) {
    gaps.push({
      dimension: 'servicos',
      severity: 'importante',
      title: 'Seção de serviços incompleta',
      description: 'Listar seus procedimentos ajuda pacientes a encontrar exatamente o que precisam.',
      action: 'Adicione pelo menos 5 procedimentos com descrição e preço (opcional).',
      estimated_impact: 5,
    })
  }

  if (data.attributeCount < 5) {
    gaps.push({
      dimension: 'atributos',
      severity: 'sugestao',
      title: 'Atributos não configurados',
      description: 'Atributos como "Aceita convênios" e "Acessível para cadeirantes" aparecem no Google Maps.',
      action: 'Configure os atributos disponíveis para sua categoria de negócio.',
      estimated_impact: 4,
    })
  }

  return gaps
}
