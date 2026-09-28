// =============================================================================
// DESTAKA — Competitive Analyzer
// Compara perfil do assinante vs concorrentes e gera gaps acionaveis
// =============================================================================

import { getAnthropic, AI_MODEL_FAST } from '@/lib/ai'
import { sanitizeForPrompt } from '@/lib/sanitize'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { OptimizationAction } from './optimizer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompetitorProfile {
  place_id: string
  name: string
  categories: string[]
  avg_rating: number | null
  review_count: number
  photo_count: number
  has_website: boolean
  description: string | null
  review_keywords: string[]
}

export interface CompetitiveGap {
  type: 'categories' | 'services' | 'description_keywords' | 'photos' | 'reviews'
  priority: 'high' | 'medium' | 'low'
  gap_description: string
  competitor_values: string[]
  client_values: string[]
  missing: string[]
  suggested_action: OptimizationAction | null
  impact_score: number
}

export interface CompetitiveAnalysisResult {
  analyzed_at: string
  competitor_count: number
  gaps: CompetitiveGap[]
  keyword_opportunities: string[]
  summary: string
}

// ---------------------------------------------------------------------------
// Main analyzer
// ---------------------------------------------------------------------------

export async function analyzeCompetitivePosition(
  clientProfile: {
    categories: string[]
    description: string | null
    photo_count: number
    review_count: number
    avg_rating: number | null
    services: Array<{ displayName?: string; name?: string }> | string[]
  },
  competitors: CompetitorProfile[]
): Promise<CompetitiveAnalysisResult> {
  const gaps: CompetitiveGap[] = []

  // 1. Categorias: consenso de 2+ concorrentes
  const categoryGaps = analyzeCategoryGaps(clientProfile.categories, competitors)
  if (categoryGaps) gaps.push(categoryGaps)

  // 2. Keywords nos reviews dos concorrentes vs descricao do cliente
  const keywordGaps = analyzeKeywordGaps(
    clientProfile.description,
    competitors
  )
  if (keywordGaps) gaps.push(keywordGaps)

  // 3. Fotos: comparacao com media dos concorrentes
  const photoGap = analyzePhotoGap(clientProfile.photo_count, competitors)
  if (photoGap) gaps.push(photoGap)

  // 4. Reviews: volume comparativo
  const reviewGap = analyzeReviewGap(
    clientProfile.review_count,
    clientProfile.avg_rating,
    competitors
  )
  if (reviewGap) gaps.push(reviewGap)

  // Coletar todas as keyword opportunities
  const allKeywords = competitors.flatMap(c => c.review_keywords)
  const keywordFreq = new Map<string, number>()
  for (const kw of allKeywords) {
    keywordFreq.set(kw, (keywordFreq.get(kw) ?? 0) + 1)
  }
  const keywordOpportunities = Array.from(keywordFreq.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([kw]) => kw)

  // Gerar resumo
  const summary = buildSummary(gaps, competitors.length)

  return {
    analyzed_at: new Date().toISOString(),
    competitor_count: competitors.length,
    gaps,
    keyword_opportunities: keywordOpportunities,
    summary,
  }
}

// ---------------------------------------------------------------------------
// Gap analyzers
// ---------------------------------------------------------------------------

function analyzeCategoryGaps(
  clientCategories: string[],
  competitors: CompetitorProfile[]
): CompetitiveGap | null {
  // Conta frequencia de cada categoria entre concorrentes
  const catFreq = new Map<string, number>()
  for (const comp of competitors) {
    for (const cat of comp.categories) {
      const normalized = cat.toLowerCase().trim()
      catFreq.set(normalized, (catFreq.get(normalized) ?? 0) + 1)
    }
  }

  const clientCatsNorm = clientCategories.map(c => c.toLowerCase().trim())

  // Categorias que 2+ concorrentes tem e o cliente nao
  const missing = Array.from(catFreq.entries())
    .filter(([cat, count]) => count >= 2 && !clientCatsNorm.includes(cat))
    .map(([cat]) => cat)

  if (missing.length === 0) return null

  return {
    type: 'categories',
    priority: 'high',
    gap_description: `${missing.length} ${missing.length === 1 ? 'categoria que' : 'categorias que'} seus concorrentes usam e voce nao tem`,
    competitor_values: Array.from(catFreq.keys()),
    client_values: clientCatsNorm,
    missing,
    suggested_action: {
      type: 'update_categories',
      label: `Adicionar ${missing.length === 1 ? 'categoria' : 'categorias'}: ${missing.slice(0, 3).join(', ')}`,
      description: `${missing.length === 1 ? 'Essa categoria aparece' : 'Essas categorias aparecem'} em 2 ou mais concorrentes da sua regiao.`,
      impact: 8,
    },
    impact_score: 8,
  }
}

function analyzeKeywordGaps(
  clientDescription: string | null,
  competitors: CompetitorProfile[]
): CompetitiveGap | null {
  // Coletar keywords de reviews com frequencia >= 2 entre concorrentes
  const allKeywords = competitors.flatMap(c => c.review_keywords)
  const kwFreq = new Map<string, number>()
  for (const kw of allKeywords) {
    kwFreq.set(kw.toLowerCase(), (kwFreq.get(kw.toLowerCase()) ?? 0) + 1)
  }

  const consensusKeywords = Array.from(kwFreq.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([kw]) => kw)

  if (consensusKeywords.length === 0) return null

  const descLower = (clientDescription ?? '').toLowerCase()
  const missing = consensusKeywords.filter(kw => !descLower.includes(kw))

  if (missing.length === 0) return null

  return {
    type: 'description_keywords',
    priority: 'high',
    gap_description: `Keywords populares nas avaliacoes dos concorrentes que nao aparecem na sua descricao`,
    competitor_values: consensusKeywords,
    client_values: clientDescription ? [clientDescription.slice(0, 100)] : [],
    missing: missing.slice(0, 10),
    suggested_action: {
      type: 'update_description',
      label: 'Otimizar descricao com keywords dos concorrentes',
      description: `Incorporar termos como "${missing.slice(0, 3).join('", "')}" que pacientes usam ao buscar servicos na sua regiao.`,
      impact: 9,
    },
    impact_score: 9,
  }
}

function analyzePhotoGap(
  clientPhotoCount: number,
  competitors: CompetitorProfile[]
): CompetitiveGap | null {
  const avgPhotos = competitors.reduce((sum, c) => sum + c.photo_count, 0) / competitors.length

  // Gap se cliente tem menos de 50% da media
  if (clientPhotoCount >= avgPhotos * 0.5) return null

  return {
    type: 'photos',
    priority: 'medium',
    gap_description: `Seus concorrentes tem em media ${Math.round(avgPhotos)} fotos. Voce tem ${clientPhotoCount}.`,
    competitor_values: competitors.map(c => `${c.name}: ${c.photo_count}`),
    client_values: [`${clientPhotoCount} fotos`],
    missing: [],
    suggested_action: null, // nao automatizavel
    impact_score: 5,
  }
}

function analyzeReviewGap(
  clientReviewCount: number,
  clientRating: number | null,
  competitors: CompetitorProfile[]
): CompetitiveGap | null {
  const avgReviews = competitors.reduce((sum, c) => sum + c.review_count, 0) / competitors.length

  // Gap se cliente tem menos de 30% do volume medio
  if (clientReviewCount >= avgReviews * 0.3) return null

  return {
    type: 'reviews',
    priority: 'low',
    gap_description: `Seus concorrentes tem em media ${Math.round(avgReviews)} avaliacoes. Voce tem ${clientReviewCount}.`,
    competitor_values: competitors.map(c => `${c.name}: ${c.review_count} (${c.avg_rating?.toFixed(1) ?? '-'})`),
    client_values: [`${clientReviewCount} avaliacoes (${clientRating?.toFixed(1) ?? '-'})`],
    missing: [],
    suggested_action: null, // nao automatizavel
    impact_score: 3,
  }
}

// ---------------------------------------------------------------------------
// Keyword extraction via Claude (batch para todos os concorrentes)
// ---------------------------------------------------------------------------

export async function extractReviewKeywords(
  competitors: Array<{ name: string; reviews: string[] }>
): Promise<string[]> {
  if (competitors.every(c => c.reviews.length === 0)) return []

  const reviewBlocks = competitors
    .filter(c => c.reviews.length > 0)
    .map(c => {
      const reviews = c.reviews.slice(0, 20).map(r => sanitizeForPrompt(r, 500))
      return `Reviews de ${sanitizeForPrompt(c.name)}:\n${reviews.join('\n')}`
    })
    .join('\n\n')

  if (!reviewBlocks.trim()) return []

  const anthropic = getAnthropic()

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL_FAST,
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Analise os reviews abaixo de clinicas concorrentes na mesma regiao.
Extraia as 10 palavras-chave mais recorrentes que pacientes usam ao descrever os servicos.
Retorne APENAS um JSON array de strings, sem markdown.

Regras:
- Foque em termos de servicos e procedimentos (nao adjetivos genericos como "bom" ou "otimo")
- Normalize variantes ("clareamento dental" e "clareamento" = "clareamento dental")
- Ignore nomes proprios de medicos ou clinicas
- Ordene por frequencia (mais recorrente primeiro)
- Sem travessao

${reviewBlocks}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return []
    return parsed.filter((k): k is string => typeof k === 'string').slice(0, 10)
  } catch (err) {
    console.error('[competitive-analyzer] keyword extraction error:', err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function saveCompetitiveAnalysis(
  db: SupabaseClient,
  organizationId: string,
  result: CompetitiveAnalysisResult
): Promise<void> {
  await db.from('competitive_analyses').insert({
    organization_id: organizationId,
    gaps: result.gaps,
    keyword_opportunities: result.keyword_opportunities,
    summary: result.summary,
    analyzed_at: result.analyzed_at,
  })
}

export async function getLatestAnalysis(
  db: SupabaseClient,
  organizationId: string
): Promise<CompetitiveAnalysisResult | null> {
  const { data } = await db
    .from('competitive_analyses')
    .select('gaps, keyword_opportunities, summary, analyzed_at')
    .eq('organization_id', organizationId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  return {
    analyzed_at: data.analyzed_at,
    competitor_count: 3,
    gaps: data.gaps as CompetitiveGap[],
    keyword_opportunities: data.keyword_opportunities as string[],
    summary: data.summary ?? '',
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSummary(gaps: CompetitiveGap[], competitorCount: number): string {
  const highGaps = gaps.filter(g => g.priority === 'high')
  const mediumGaps = gaps.filter(g => g.priority === 'medium')

  if (highGaps.length === 0 && mediumGaps.length === 0) {
    return `Seu perfil esta bem posicionado em relacao aos ${competitorCount} concorrentes analisados.`
  }

  const parts: string[] = []
  if (highGaps.length > 0) {
    parts.push(`${highGaps.length} ${highGaps.length === 1 ? 'oportunidade prioritaria' : 'oportunidades prioritarias'}`)
  }
  if (mediumGaps.length > 0) {
    parts.push(`${mediumGaps.length} ${mediumGaps.length === 1 ? 'melhoria recomendada' : 'melhorias recomendadas'}`)
  }

  return `Analise de ${competitorCount} concorrentes identificou ${parts.join(' e ')} para melhorar seu posicionamento.`
}
