// Instagram Caption Rewriter
// Reescreve captions do Instagram com keywords de SEO local para GBP

import { generateContent } from '@/lib/ai/client'
import { validateCompliance } from '@/lib/ai/compliance-validator'

export interface RewriteParams {
  originalCaption: string
  specialty: string
  professionalName: string
  city: string
  neighborhood?: string
  keywords?: string[]
  tone?: string
}

export interface RewriteResult {
  rewrittenCaption: string
  keywordsInjected: string[]
  compliancePassed: boolean
  complianceNotes?: string
}

const SYSTEM_PROMPT = `Voce e especialista em SEO local para Google Business Profile no Brasil. Reescreve textos do Instagram para posts do Google Meu Negocio, mantendo o tom e personalidade do profissional original. Nunca use travessao. Retorne APENAS JSON valido.`

export async function rewriteCaption(params: RewriteParams): Promise<RewriteResult> {
  const {
    originalCaption,
    specialty,
    professionalName,
    city,
    neighborhood,
    keywords = [],
    tone = 'proximo',
  } = params

  const location = neighborhood ? `${neighborhood}, ${city}` : city
  const keywordList = keywords.length > 0
    ? keywords.join(', ')
    : `${specialty} em ${city}, ${specialty} ${neighborhood ?? city}, agendar consulta ${specialty}`

  const prompt = `Reescreva o texto abaixo (originalmente publicado no Instagram) para um post do Google Meu Negocio.

TEXTO ORIGINAL DO INSTAGRAM:
"${originalCaption}"

CONTEXTO:
- Profissional: ${professionalName}, ${specialty} em ${location}
- Keywords de SEO local para injetar naturalmente: ${keywordList}
- Tom: ${tone}

REGRAS:
- Maximo 1500 caracteres (limite GBP)
- Remover hashtags (GBP nao indexa hashtags)
- Remover mencoes (@usuario) que nao fazem sentido fora do Instagram
- Manter a essencia e tom do texto original
- Adicionar 2-3 keywords de busca local naturalmente
- Incluir CTA sutil ao final (agende, entre em contato, conheca)
- Compliance CFM/CRO/COFFITO: sem precos, sem promessas de resultado, sem superlativos proibidos
- Nunca use travessao

Retorne JSON com esta estrutura:
{
  "rewritten_caption": "texto reescrito para o GBP",
  "keywords_injected": ["keyword1", "keyword2"]
}

Retorne APENAS o JSON.`

  try {
    const raw = await generateContent(prompt, SYSTEM_PROMPT)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        rewritten_caption: string
        keywords_injected: string[]
      }

      // Validacao de compliance independente (mesmo padrao do post-generator)
      const compliance = await validateCompliance(parsed.rewritten_caption)

      return {
        rewrittenCaption: parsed.rewritten_caption,
        keywordsInjected: parsed.keywords_injected ?? [],
        compliancePassed: compliance.passed,
        complianceNotes: !compliance.passed
          ? compliance.violations.join('; ')
          : undefined,
      }
    }
  } catch {
    // fallback abaixo
  }

  return {
    rewrittenCaption: '',
    keywordsInjected: [],
    compliancePassed: false,
    complianceNotes: 'Rewriter falhou. Caption nao processada.',
  }
}
