// =============================================================================
// DESTAKA Content Pipeline — Estrategista
// Organiza keywords em pauta editorial de 15 dias
// =============================================================================

import { getAnthropic, AI_MODEL_FAST } from '@/lib/ai'
import { logger } from '@/lib/logger'
import type { KeywordResult, EditorialCalendar } from './types'

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

  // Pega top keywords (limite de 120 para cobrir 2 posts/dia x 15 dias)
  const topKeywords = keywords.slice(0, 120)

  // Monta o calendario de Instagram para o prompt saber quais dias tem post
  // seg/qua/sex = reel, ter/qui = carrossel
  const igScheduleLines: string[] = []
  const tempDate = new Date(startDate)
  for (let i = 0; i < days; i++) {
    const dow = tempDate.getDay() // 0=dom, 1=seg, ...
    const dateStr = formatDate(tempDate)
    if (dow === 1 || dow === 3 || dow === 5) {
      igScheduleLines.push(`${dateStr} (${['dom','seg','ter','qua','qui','sex','sab'][dow]}): reel`)
    } else if (dow === 2 || dow === 4) {
      igScheduleLines.push(`${dateStr} (${['dom','seg','ter','qua','qui','sex','sab'][dow]}): carrossel`)
    }
    // sabado e domingo: sem Instagram
    tempDate.setDate(tempDate.getDate() + 1)
  }

  const prompt = `Voce e o estrategista de conteudo do Destaka, plataforma de presenca digital para profissionais de saude brasileiros (dentistas, medicos, clinicas).

## Tarefa
Crie uma pauta editorial de ${days} dias (de ${formatDate(startDate)} a ${formatDate(endDate)}).

## Volume por dia
- Blog: 2 posts por dia (total: 28 na quinzena). Mix de article, faq e howto.
- LinkedIn: 2 posts por dia (total: 28 na quinzena).
- Instagram: apenas nos dias indicados abaixo (3 reels/semana + 2 carrosseis/semana = 5/semana, ~10 na quinzena).

## Regras obrigatorias
1. Cada dia tem EXATAMENTE 2 blog posts e 2 LinkedIn posts.
2. Instagram: somente nos dias listados na secao "Calendario Instagram". Nos demais dias, "instagram": null.
3. Tiers de blog:
   - 1 long-form por semana (terca ou quarta). Long-form = tier 1, 2000+ palavras, schema "article" ou "howto".
   - 5 FAQs por semana (tier 3, 300-500 palavras, schema "faq"). Distribua entre os 2 posts do dia.
   - Restante: tier 2, 800-1200 palavras, schema "article" ou "howto".
4. NUNCA repita keyword principal entre posts (nenhum post pode ter a mesma keyword principal que outro).
5. Keywords de fundo de funil devem aparecer nas tercas e quintas (dias de maior conversao).
6. LinkedIn: hook provocativo, angulo profissional, tom de autoridade acessivel. Os 2 posts de cada dia devem ter angulos diferentes.
7. NUNCA use travessao (—) em nenhum texto.
8. Todos os titulos devem ser em portugues brasileiro com acentuacao 100% correta.
9. CTA de todo blog post aponta para /saude/verificar (diagnostico gratuito).

## Calendario Instagram (dias que TEM post)
${igScheduleLines.join('\n')}
Dias nao listados: "instagram": null (sem post).

## Keywords disponiveis (ordenadas por score)
${topKeywords.map((k, i) => `${i + 1}. "${k.keyword}" | volume: ${k.volume} | intent: ${k.intent} | funil: ${k.funnelStage} | score: ${k.score} | dor: ${k.pain}`).join('\n')}

## Formato de resposta
Retorne APENAS um JSON valido (sem markdown, sem explicacao) com esta estrutura:
{
  "period": { "start": "${formatDate(startDate)}", "end": "${formatDate(endDate)}" },
  "days": [
    {
      "date": "YYYY-MM-DD",
      "blogPosts": [
        {
          "keyword": "keyword principal",
          "secondaryKeywords": ["kw2", "kw3"],
          "schema": "article" | "faq" | "howto",
          "suggestedTitle": "Titulo do artigo",
          "targetWordCount": 1000,
          "tier": 1 | 2 | 3
        },
        {
          "keyword": "outra keyword",
          "secondaryKeywords": ["kw4"],
          "schema": "article" | "faq" | "howto",
          "suggestedTitle": "Outro titulo",
          "targetWordCount": 800,
          "tier": 2 | 3
        }
      ],
      "linkedinPosts": [
        {
          "angle": "angulo do post 1",
          "hook": "primeira frase que prende atencao"
        },
        {
          "angle": "angulo do post 2",
          "hook": "outra primeira frase"
        }
      ],
      "instagram": {
        "type": "carrossel" | "reel",
        "angle": "angulo do post",
        "slides": 6
      }
    }
  ]
}

IMPORTANTE: quando o dia NAO tem Instagram, o campo "instagram" deve ser null (nao omitir, colocar null explicitamente).
Campos "slides" so e necessario para type "carrossel" (5-8 slides). Para "reel", nao incluir "slides".`

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL_FAST,
      max_tokens: 16384,
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
      if (!day.date || !day.blogPosts || !day.linkedinPosts) {
        throw new Error(`Dia incompleto no calendario: ${day.date}`)
      }
      if (day.blogPosts.length < 2) {
        throw new Error(`Dia ${day.date} com menos de 2 blog posts`)
      }
      if (day.linkedinPosts.length < 2) {
        throw new Error(`Dia ${day.date} com menos de 2 LinkedIn posts`)
      }
    }

    const allPosts = calendar.days.flatMap((d) => d.blogPosts)
    logger.info(SERVICE, `pauta criada: ${calendar.days.length} dias, ${allPosts.length} blog posts`, {
      period: calendar.period,
      totalBlogPosts: allPosts.length,
      totalLinkedinPosts: calendar.days.flatMap((d) => d.linkedinPosts).length,
      instagramDays: calendar.days.filter((d) => d.instagram !== null).length,
      longForms: allPosts.filter((p) => p.tier === 1).length,
      faqs: allPosts.filter((p) => p.schema === 'faq').length,
      articles: allPosts.filter((p) => p.schema === 'article').length,
    })

    return calendar
  } catch (err) {
    logger.error(SERVICE, 'erro ao criar pauta editorial', {
      err: String(err),
    })
    throw err
  }
}
