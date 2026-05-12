// =============================================================================
// DESTAKA Content Pipeline — Research Agent
// Busca keywords via Google Autocomplete + expande + classifica com Claude
// =============================================================================

import { getAnthropic, AI_MODEL_FAST } from '@/lib/ai'
import { logger } from '@/lib/logger'
import type { KeywordResult } from './types'

const SERVICE = 'content/research'

// 20 seed keywords do nicho saude + presenca digital
const SEED_KEYWORDS = [
  'google meu negócio dentista',
  'como aparecer no google maps clínica',
  'avaliações google consultório',
  'marketing digital para dentistas',
  'seo local para médicos',
  'perfil google médico',
  'como conseguir mais pacientes',
  'google meu negócio para médicos',
  'como responder avaliação negativa',
  'fotos consultório google',
  'como aparecer primeiro no google',
  'pacientes pelo google',
  'presença digital médico',
  'marketing odontológico',
  'ranking google maps clínica',
  'google business profile dentista',
  'avaliação google estrelas',
  'posicionamento google consultório',
  'agenda cheia dentista',
  'clínica invisível no google',
]

const QUESTION_PREFIXES = [
  'como',
  'por que',
  'quando',
  'quanto custa',
  'o que é',
  'qual melhor',
]

/**
 * Busca sugestoes do Google Autocomplete para uma query.
 * Endpoint publico, sem auth necessaria.
 */
async function fetchAutocompleteSuggestions(query: string): Promise<string[]> {
  try {
    const encoded = encodeURIComponent(query)
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&q=${encoded}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return []

    const data = await res.json()
    // Formato Firefox: [query, [suggestions]]
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1] as string[]
    }
    return []
  } catch (err) {
    logger.warn(SERVICE, `autocomplete falhou para "${query}"`, {
      err: String(err),
    })
    return []
  }
}

/**
 * Expande seeds com prefixos de pergunta e coleta autocomplete.
 */
async function expandKeywords(seeds: string[]): Promise<string[]> {
  const all = new Set<string>()

  // Adiciona seeds originais
  for (const seed of seeds) {
    all.add(seed.toLowerCase().trim())
  }

  // Gera variantes com prefixos de pergunta
  const queries: string[] = [...seeds]
  for (const seed of seeds) {
    for (const prefix of QUESTION_PREFIXES) {
      queries.push(`${prefix} ${seed}`)
    }
  }

  // Busca autocomplete em lotes de 10 (evita rate limiting)
  const batchSize = 10
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map((q) => fetchAutocompleteSuggestions(q))
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const suggestion of result.value) {
          all.add(suggestion.toLowerCase().trim())
        }
      }
    }

    // Pausa entre lotes para nao sobrecarregar
    if (i + batchSize < queries.length) {
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  logger.info(SERVICE, `${all.size} keywords unicas apos expansao`)
  return Array.from(all)
}

/**
 * Classifica keywords usando Claude (em lotes para economizar tokens).
 */
async function classifyKeywords(
  keywords: string[]
): Promise<KeywordResult[]> {
  const anthropic = getAnthropic()
  const results: KeywordResult[] = []
  const batchSize = 30

  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize)

    const prompt = `Voce e um especialista em SEO para profissionais de saude no Brasil (dentistas, medicos, clinicas).

Classifique cada keyword abaixo. Para cada uma, retorne um JSON com:
- keyword: a keyword original
- volume: "alto", "medio" ou "baixo" (estimativa de busca mensal no Brasil)
- intent: "informacional", "transacional" ou "navegacional"
- pain: qual problema do profissional de saude essa keyword resolve (uma frase curta)
- funnelStage: "topo", "meio" ou "fundo"
- score: de 1 a 100 (priorizacao para blog do Destaka, onde 100 = melhor oportunidade)

Criterios de score:
- Keywords transacionais e fundo de funil recebem score mais alto
- Keywords com alta relevancia para "presenca digital de clinicas" recebem bonus
- Keywords muito genericas (sem relacao com saude/clinicas) recebem score baixo

Retorne APENAS um array JSON valido, sem markdown, sem explicacao.

Keywords:
${batch.map((k, idx) => `${idx + 1}. ${k}`).join('\n')}`

    try {
      const response = await anthropic.messages.create({
        model: AI_MODEL_FAST,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })

      const text =
        response.content[0].type === 'text' ? response.content[0].text : ''

      // Extrai JSON do response (pode vir com whitespace)
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as KeywordResult[]
        results.push(...parsed)
      }
    } catch (err) {
      logger.error(SERVICE, `erro ao classificar batch ${i}`, {
        err: String(err),
      })
    }
  }

  // Ordena por score decrescente
  results.sort((a, b) => b.score - a.score)

  logger.info(SERVICE, `${results.length} keywords classificadas`, {
    top5: results.slice(0, 5).map((k) => `${k.keyword} (${k.score})`),
  })

  return results
}

/**
 * Pipeline completo do Research Agent.
 * Retorna keywords priorizadas e classificadas.
 */
export async function runResearch(): Promise<KeywordResult[]> {
  logger.info(SERVICE, 'iniciando pesquisa de keywords')

  const expanded = await expandKeywords(SEED_KEYWORDS)
  const classified = await classifyKeywords(expanded)

  logger.info(SERVICE, `pesquisa concluida: ${classified.length} keywords`, {
    topKeyword: classified[0]?.keyword,
    topScore: classified[0]?.score,
  })

  return classified
}
