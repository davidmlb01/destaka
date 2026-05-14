import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { getAnthropic, AI_MODEL_FAST } from '@/lib/ai'
import { rateLimit } from '@/lib/redis'
import { createClient } from '@/lib/supabase/server'

export interface KeywordSuggestion {
  keyword: string
  autocomplete: boolean
}

// GET /api/keywords/suggestions?specialty=Dentista&city=São Paulo
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user: rlUser } } = await supabase.auth.getUser()
  if (rlUser) {
    const count = await rateLimit(`keywords-suggestions:${rlUser.id}`, 3600)
    if (count !== null && count > 50) {
      return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, { status: 429 })
    }
  }

  const auth = await getAuthenticatedProfile('id, category, name')
  if (auth.error) return auth.error

  const { profile } = auth
  const { searchParams } = new URL(req.url)

  const specialty = searchParams.get('specialty') || (profile.category as string) || 'profissional de saúde'
  const city = searchParams.get('city') || ''

  if (!specialty) {
    return NextResponse.json({ error: 'Especialidade é obrigatória' }, { status: 400 })
  }

  try {
    // Gerar sugestões via Claude
    const anthropic = getAnthropic()
    const locationContext = city ? ` na cidade de ${city}` : ''

    const response = await anthropic.messages.create({
      model: AI_MODEL_FAST,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Gere exatamente 20 keywords que pacientes reais usam no Google para encontrar um(a) ${specialty}${locationContext}.

Regras:
- Keywords em português brasileiro
- Misture intenção informacional ("como funciona clareamento dental") e transacional ("dentista perto de mim")
- Inclua variações com e sem localidade
- Inclua long-tail (3+ palavras)
- NÃO inclua aspas, numeração ou explicação

Retorne APENAS as keywords, uma por linha, sem nenhum texto adicional.`,
        },
      ],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const rawText = textBlock?.type === 'text' ? textBlock.text : ''
    const suggestedKeywords = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length < 120)
      .slice(0, 20)

    // Validar contra Google Autocomplete
    const suggestions: KeywordSuggestion[] = await Promise.all(
      suggestedKeywords.map(async (keyword) => {
        const autocomplete = await checkGoogleAutocomplete(keyword)
        return { keyword, autocomplete }
      })
    )

    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[api/keywords/suggestions] Erro:', err)
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

/**
 * Verifica se a keyword aparece nas sugestões do Google Autocomplete.
 * Usa o endpoint público (gratuito, sem API key).
 */
async function checkGoogleAutocomplete(query: string): Promise<boolean> {
  try {
    const encoded = encodeURIComponent(query)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&q=${encoded}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)

    if (!res.ok) return false

    const data = (await res.json()) as [string, string[]]
    const suggestions = data[1] ?? []

    // Verifica se a query (ou algo muito parecido) aparece nas sugestões
    const queryLower = query.toLowerCase()
    return suggestions.some(s => {
      const sLower = s.toLowerCase()
      return sLower.includes(queryLower) || queryLower.includes(sLower)
    })
  } catch {
    return false
  }
}
