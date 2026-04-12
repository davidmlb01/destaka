// Competitor Intelligence Engine — Story 003
// Analisa benchmark e teardown de reviews dos concorrentes via Claude

import { generateContent } from '@/lib/ai/client'

export interface CompetitorSnapshot {
  name: string
  place_id: string
  categories: string[]
  review_count: number
  avg_rating: number
}

export interface CompetitorBenchmark {
  generated_at: string
  own_profile: {
    name: string
    review_count: number
    avg_rating: number
    category_count: number
    has_description: boolean
    photo_count: number
  }
  competitors: CompetitorSnapshot[]
  teardown: CompetitorTeardown
  opportunities: string[]
}

export interface CompetitorTeardown {
  review_velocity: string    // ex: "Clínica A recebe ~3 reviews/semana, você recebe 1"
  keyword_gaps: string[]     // keywords citadas em reviews deles, ausentes nos seus
  sentiment_comparison: string
  strengths_vs_you: string[]
  weaknesses_exploitable: string[]
}

export async function analyzeCompetitors(params: {
  ownName: string
  ownReviewCount: number
  ownAvgRating: number
  ownCategoryCount: number
  ownHasDescription: boolean
  ownPhotoCount: number
  competitors: CompetitorSnapshot[]
  specialty: string
}): Promise<CompetitorBenchmark> {
  const {
    ownName, ownReviewCount, ownAvgRating, ownCategoryCount,
    ownHasDescription, ownPhotoCount, competitors, specialty,
  } = params

  const ownProfile = {
    name: ownName,
    review_count: ownReviewCount,
    avg_rating: ownAvgRating,
    category_count: ownCategoryCount,
    has_description: ownHasDescription,
    photo_count: ownPhotoCount,
  }

  const prompt = `Você é especialista em SEO local para profissionais de saúde no Brasil.

PERFIL DO PROFISSIONAL:
${JSON.stringify(ownProfile, null, 2)}

CONCORRENTES (top ${competitors.length}):
${JSON.stringify(competitors, null, 2)}

Especialidade: ${specialty}

Analise o benchmark competitivo e retorne um JSON com esta estrutura exata:
{
  "teardown": {
    "review_velocity": "comparação de velocidade de novos reviews (ex: Concorrente A cresce 3x mais rápido)",
    "keyword_gaps": ["keyword 1 mencionada em reviews deles", "keyword 2", "keyword 3"],
    "sentiment_comparison": "análise geral de sentimento: pontos fortes dos concorrentes vs você",
    "strengths_vs_you": ["ponto forte do concorrente que você não tem 1", "ponto 2"],
    "weaknesses_exploitable": ["fraqueza explorável do concorrente 1", "fraqueza 2"]
  },
  "opportunities": [
    "oportunidade específica e acionável 1",
    "oportunidade 2",
    "oportunidade 3"
  ]
}

Seja específico, cite nomes dos concorrentes. Retorne APENAS o JSON, sem texto adicional.`

  const systemPrompt = `Você é especialista em Google Business Profile e inteligência competitiva para clínicas de saúde no Brasil. Responda sempre em português brasileiro. Retorne apenas JSON válido quando solicitado.`

  let teardown: CompetitorTeardown = {
    review_velocity: 'Dados insuficientes para análise de velocidade.',
    keyword_gaps: [],
    sentiment_comparison: 'Análise indisponível.',
    strengths_vs_you: [],
    weaknesses_exploitable: [],
  }
  let opportunities: string[] = []

  try {
    const raw = await generateContent(prompt, systemPrompt)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        teardown: CompetitorTeardown
        opportunities: string[]
      }
      teardown = parsed.teardown
      opportunities = parsed.opportunities
    }
  } catch {
    // Fallback baseado em dados numéricos
    const topCompetitor = competitors[0]
    if (topCompetitor) {
      if (topCompetitor.review_count > ownReviewCount) {
        opportunities.push(`${topCompetitor.name} tem ${topCompetitor.review_count - ownReviewCount} reviews a mais — foque em pedir avaliações ativamente.`)
      }
      if ((topCompetitor.avg_rating ?? 0) < ownAvgRating) {
        opportunities.push(`Sua nota média (${ownAvgRating.toFixed(1)}) é superior à de ${topCompetitor.name} (${topCompetitor.avg_rating?.toFixed(1)}) — destaque isso.`)
      }
    }
    if (!ownHasDescription) {
      opportunities.push('Adicione uma descrição ao seu perfil — diferencia você de concorrentes sem descrição.')
    }
  }

  return {
    generated_at: new Date().toISOString(),
    own_profile: ownProfile,
    competitors,
    teardown,
    opportunities,
  }
}
