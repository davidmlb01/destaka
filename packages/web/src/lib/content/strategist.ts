// =============================================================================
// DESTAKA Content Pipeline — Estrategista
// Organiza keywords em pauta editorial de 15 dias
// =============================================================================

import { getAnthropic, AI_MODEL_FAST } from '@/lib/ai'
import { logger } from '@/lib/logger'
import type { KeywordResult, EditorialCalendar, DayBrief } from './types'

const SERVICE = 'content/strategist'

/**
 * Constroi calendario editorial de N dias a partir de keywords priorizadas.
 */
export async function buildEditorialCalendar(
  keywords: KeywordResult[],
  days: number = 15
): Promise<EditorialCalendar> {
  const anthropic = getAnthropic()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 1) // comeca amanha
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + days - 1)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  // Pega top keywords (limite de 80 para nao estourar context)
  const topKeywords = keywords.slice(0, 80)

  const prompt = `Voce e o estrategista de conteudo do Destaka, plataforma de presenca digital para profissionais de saude brasileiros (dentistas, medicos, clinicas).

## Tarefa
Crie uma pauta editorial de ${days} dias (de ${formatDate(startDate)} a ${formatDate(endDate)}).

## Regras obrigatorias
1. Cada dia tem EXATAMENTE: 1 blog post + 1 post LinkedIn + 1 post Instagram
2. Marque 1 long-form por semana (terca ou quarta). Long-form = 2000+ palavras, tier 1
3. Distribua 5 FAQs por semana (schema "faq", 300-500 palavras, tier 3)
4. Os demais dias sao artigos medios (800-1200 palavras, tier 2) ou howtos
5. NUNCA repita keyword principal entre dias
6. Keywords de fundo de funil devem aparecer nas tercas e quintas (dias de maior conversao)
7. Instagram: alterne entre "carrossel" (5-8 slides) e "estatico"
8. LinkedIn: hook provocativo, angulo profissional, tom de autoridade acessivel
9. NUNCA use travessao (—) em nenhum texto
10. Todos os titulos devem ser em portugues brasileiro com acentuacao 100% correta
11. CTA de todo blog post aponta para /saude/verificar (diagnostico gratuito)

## Keywords disponiveis (ordenadas por score)
${topKeywords.map((k, i) => `${i + 1}. "${k.keyword}" | volume: ${k.volume} | intent: ${k.intent} | funil: ${k.funnelStage} | score: ${k.score} | dor: ${k.pain}`).join('\n')}

## Formato de resposta
Retorne APENAS um JSON valido (sem markdown, sem explicacao) com esta estrutura:
{
  "period": { "start": "${formatDate(startDate)}", "end": "${formatDate(endDate)}" },
  "days": [
    {
      "date": "YYYY-MM-DD",
      "blogPost": {
        "keyword": "keyword principal",
        "secondaryKeywords": ["kw2", "kw3"],
        "schema": "article" | "faq" | "howto",
        "suggestedTitle": "Titulo do artigo",
        "targetWordCount": 1000,
        "tier": 1 | 2 | 3
      },
      "linkedin": {
        "angle": "angulo do post",
        "hook": "primeira frase que prende atencao"
      },
      "instagram": {
        "type": "carrossel" | "estatico",
        "angle": "angulo do post",
        "slides": 6
      }
    }
  ]
}`

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL_FAST,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // Extrai JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Resposta do Claude nao contem JSON valido')
    }

    const calendar = JSON.parse(jsonMatch[0]) as EditorialCalendar

    // Validacao basica
    if (!calendar.days || calendar.days.length === 0) {
      throw new Error('Calendario vazio retornado pelo Claude')
    }

    // Garante que todos os campos obrigatorios existem
    for (const day of calendar.days) {
      if (!day.date || !day.blogPost || !day.linkedin || !day.instagram) {
        throw new Error(`Dia incompleto no calendario: ${day.date}`)
      }
    }

    logger.info(SERVICE, `pauta criada: ${calendar.days.length} dias`, {
      period: calendar.period,
      longForms: calendar.days.filter((d: DayBrief) => d.blogPost.tier === 1).length,
      faqs: calendar.days.filter((d: DayBrief) => d.blogPost.schema === 'faq').length,
      articles: calendar.days.filter((d: DayBrief) => d.blogPost.schema === 'article').length,
    })

    return calendar
  } catch (err) {
    logger.error(SERVICE, 'erro ao criar pauta editorial', {
      err: String(err),
    })
    throw err
  }
}
