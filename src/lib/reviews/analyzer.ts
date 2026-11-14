// EPIC-009: Review Intelligence, analise de avaliacoes via Claude
// Extrai temas elogiados e pontos de atencao dos textos de reviews

import { generateContent } from '@/lib/ai/client'
import { getEngineContext } from '@/lib/vertical-vocab'

export interface ReviewAnalysis {
  totalReviews: number
  averageRating: number
  topPraises: Array<{ theme: string; count: number }> // max 3
  concerns: Array<{ theme: string; count: number }> | null // null if no negative reviews
}

function buildSystemPrompt(specialty?: string | null): string {
  const ctx = getEngineContext(specialty)
  return (
    `Você é um analista de avaliações de ${ctx.vocab.clientes} em ${ctx.vocab.local}. ` +
    'Responda exclusivamente em JSON válido, sem markdown, sem explicação.'
  )
}

function buildAnalysisPrompt(
  reviews: Array<{ comment: string | null; rating: number }>,
  specialty?: string | null
): string {
  const ctx = getEngineContext(specialty)
  const textsBlock = reviews
    .filter((r) => r.comment)
    .map((r) => `[${r.rating}★] ${r.comment}`)
    .join('\n')

  return (
    `Analise estas avaliações de ${ctx.vocab.clientes}. Extraia:\n` +
    '(1) as 3 palavras/temas mais elogiados (campo "topPraises", array com { "theme": string, "count": number })\n' +
    '(2) pontos de atenção mencionados em avaliações 1-3 estrelas (campo "concerns", array com { "theme": string, "count": number }, ou null se não houver avaliações negativas)\n\n' +
    'Responda APENAS com JSON no formato:\n' +
    '{"topPraises": [...], "concerns": [...] | null}\n\n' +
    'Avaliações:\n' +
    textsBlock
  )
}

export async function analyzeMonthlyReviews(
  reviews: Array<{ comment: string | null; rating: number }>,
  specialty?: string | null
): Promise<ReviewAnalysis> {
  const totalReviews = reviews.length

  // Sem avaliacoes no mes: retorno imediato
  if (totalReviews === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      topPraises: [],
      concerns: null,
    }
  }

  const averageRating = parseFloat(
    (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
  )

  // Sem textos (so ratings): pula chamada ao Claude
  const reviewsWithText = reviews.filter((r) => r.comment && r.comment.trim().length > 0)
  if (reviewsWithText.length === 0) {
    return {
      totalReviews,
      averageRating,
      topPraises: [],
      concerns: null,
    }
  }

  const prompt = buildAnalysisPrompt(reviews, specialty)
  const systemPrompt = buildSystemPrompt(specialty)
  const raw = await generateContent(prompt, systemPrompt)

  let parsed: { topPraises: Array<{ theme: string; count: number }>; concerns: Array<{ theme: string; count: number }> | null }
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Fallback se o modelo retornar JSON invalido
    return {
      totalReviews,
      averageRating,
      topPraises: [],
      concerns: null,
    }
  }

  return {
    totalReviews,
    averageRating,
    topPraises: (parsed.topPraises ?? []).slice(0, 3),
    concerns: parsed.concerns && parsed.concerns.length > 0 ? parsed.concerns : null,
  }
}
