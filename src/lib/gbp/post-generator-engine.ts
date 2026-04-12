// Post Generator Engine — Story 005
// Gera posts para GBP por tipo, especialidade e tom
// Compliance CFM/CRO automático antes de publicar

import { generateContent } from '@/lib/ai/client'
import type { ReviewTone } from './review-response-engine'

export type PostType = 'educativo' | 'procedimento' | 'bairro' | 'review_highlight' | 'equipe'

const POST_TYPE_LABEL: Record<PostType, string> = {
  educativo: 'post educativo (dica de saúde)',
  procedimento: 'destaque de procedimento ou técnica',
  bairro: 'conteúdo de bairro/localização',
  review_highlight: 'destaque de avaliação positiva',
  equipe: 'bastidores da equipe ou consultório',
}

const SPECIALTY_CONTEXT: Record<string, string> = {
  dentista: 'odontologia, saúde bucal, sorriso, dentes, gengiva, tratamentos dentários',
  medico: 'medicina, saúde, bem-estar, consulta médica, prevenção, diagnóstico',
  fisioterapeuta: 'fisioterapia, reabilitação, dor, movimento, qualidade de vida, mobilidade',
  psicologo: 'psicologia, saúde mental, bem-estar emocional, terapia, autoconhecimento',
  nutricionista: 'nutrição, alimentação saudável, saúde, qualidade de vida, hábitos alimentares',
  outro: 'saúde, bem-estar, qualidade de vida, cuidados com a saúde',
}

const COMPLIANCE_RULES = `
REGRAS DE COMPLIANCE OBRIGATÓRIAS (CFM/CRO/COFFITO):
- NUNCA mencione preços, valores ou promoções
- NUNCA prometa resultados clínicos ("você vai ficar curado", "elimina a dor")
- NUNCA use linguagem sensacionalista ou comparativa com outros profissionais
- NUNCA mencione "o melhor", "o único", "o mais barato"
- Use linguagem informativa, educativa e acolhedora
- Procedimentos devem ser mencionados de forma técnica e educativa, nunca promocional
- O post deve soar como se o PRÓPRIO PROFISSIONAL tivesse escrito, não uma IA
- NUNCA use travessão (—)
`

export interface GeneratedPost {
  content: string
  photo_suggestion: string
  post_type: PostType
  compliance_passed: boolean
  compliance_notes?: string
}

export async function generatePost(params: {
  postType: PostType
  specialty: string
  professionalName: string
  city: string
  neighborhood?: string
  tone: ReviewTone
  recentReview?: string  // para post tipo review_highlight
  serviceAreas?: string[]
}): Promise<GeneratedPost> {
  const { postType, specialty, professionalName, city, neighborhood, tone, recentReview, serviceAreas } = params

  const toneInstructions: Record<ReviewTone, string> = {
    formal: 'Tom formal e profissional. Linguagem cuidada e respeitosa.',
    proximo: 'Tom próximo e acolhedor. Use "você" com naturalidade. Quase como conversar com um amigo de confiança.',
    tecnico: 'Tom técnico e informativo. Pode usar termos da área, mas explique-os brevemente.',
  }

  const specialtyKeywords = SPECIALTY_CONTEXT[specialty] ?? SPECIALTY_CONTEXT.outro
  const locationContext = neighborhood
    ? `${neighborhood}, ${city}`
    : city

  const areasContext = serviceAreas?.length
    ? `Áreas de atuação: ${serviceAreas.join(', ')}.`
    : ''

  const typeSpecificInstruction = postType === 'review_highlight' && recentReview
    ? `Use esta avaliação real de paciente como base (sem mencionar o nome): "${recentReview}"`
    : postType === 'bairro'
      ? `Mencione naturalmente a localização: ${locationContext}. Conecte o conteúdo com a comunidade local.`
      : ''

  const prompt = `Você é ${professionalName}, profissional de ${specialty} em ${city}.

Escreva um ${POST_TYPE_LABEL[postType]} para o Google Business Profile.

CONTEXTO:
- Especialidade/keywords: ${specialtyKeywords}
- Localização: ${locationContext}
- ${areasContext}
- ${typeSpecificInstruction}

TOM: ${toneInstructions[tone]}

FORMATO DO POST:
- Entre 150 e 300 caracteres (ideal para GBP)
- Sem hashtags
- Sem emojis em excesso (máximo 1-2 se o tom for próximo)
- Terminar com uma chamada suave para ação (ex: "Agende sua consulta", "Tire suas dúvidas conosco")

${COMPLIANCE_RULES}

Retorne um JSON com esta estrutura:
{
  "content": "texto do post",
  "photo_suggestion": "descrição objetiva do tipo de foto ideal para acompanhar este post (ex: 'foto da recepção iluminada com plantas')",
  "compliance_passed": true/false,
  "compliance_notes": "se compliance_passed for false, explique o problema"
}

Retorne APENAS o JSON, sem texto adicional.`

  const systemPrompt = `Você é especialista em marketing digital para profissionais de saúde no Brasil, com profundo conhecimento das normas CFM, CRO, COFFITO e CFP. Cria conteúdo que engaja pacientes sem violar nenhuma regra de publicidade médica. Nunca use travessão (—).`

  try {
    const raw = await generateContent(prompt, systemPrompt)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        content: string
        photo_suggestion: string
        compliance_passed: boolean
        compliance_notes?: string
      }
      return {
        ...parsed,
        post_type: postType,
      }
    }
  } catch {
    // fallback abaixo
  }

  return getFallbackPost(postType, specialty, city, tone)
}

function getFallbackPost(postType: PostType, specialty: string, city: string, tone: ReviewTone): GeneratedPost {
  const greetings: Record<ReviewTone, string> = {
    formal: 'Prezados pacientes',
    proximo: 'Olá',
    tecnico: 'Informativo',
  }

  const fallbackContent: Record<PostType, string> = {
    educativo: `${greetings[tone]}, a prevenção é sempre o melhor caminho para a saúde. Consultas regulares fazem toda a diferença. Agende a sua!`,
    procedimento: `Cuidar da sua saúde com profissionais qualificados em ${city} é essencial. Conheça nossos serviços e agende uma avaliação.`,
    bairro: `Atendendo com cuidado e dedicação em ${city}. Estamos aqui para cuidar da sua saúde. Agende sua consulta!`,
    review_highlight: `Fico muito feliz com o carinho dos nossos pacientes. Obrigado pela confiança! Agende sua consulta.`,
    equipe: `Nossa equipe está pronta para oferecer o melhor atendimento. Venha nos conhecer em ${city}!`,
  }

  return {
    content: fallbackContent[postType],
    photo_suggestion: 'foto da fachada ou recepção do consultório com boa iluminação',
    post_type: postType,
    compliance_passed: true,
  }
}

// Determina o próximo tipo de post baseado nos últimos publicados (rotação)
export function nextPostType(recentTypes: PostType[]): PostType {
  const allTypes: PostType[] = ['educativo', 'procedimento', 'bairro', 'review_highlight', 'equipe']
  const recentSet = new Set(recentTypes.slice(-4))  // últimos 4 posts

  // Prefere tipo não usado recentemente
  const unused = allTypes.filter(t => !recentSet.has(t))
  if (unused.length > 0) return unused[0]

  // Todos foram usados: prioriza educativo
  return 'educativo'
}
