// Post Generator Engine — Story 005 / 6.3
// Gera posts para GBP por tipo, especialidade e tom
// Compliance CFM/CRO: validador independente (Correção A) + diversidade (Correção C)
// Story 6.3: multi-vertical via getEngineContext()

import { generateContent } from '@/lib/ai/client'
import { validateCompliance } from '@/lib/ai/compliance-validator'
import { getEngineContext } from '@/lib/vertical-vocab'
import type { ReviewTone } from './review-response-engine'

export type PostType = 'educativo' | 'procedimento' | 'bairro' | 'review_highlight' | 'equipe'

export interface GeneratedPost {
  content: string
  photo_suggestion: string
  post_type: PostType
  compliance_passed: boolean
  compliance_notes?: string
}

// Gera seed de diversidade para evitar conteúdo duplicado entre clientes (Correção C)
// Combina semana do ano + sequência do post para garantir unicidade temporal
function getDiversityContext(postSequence?: number): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 0)
  const weekNumber = Math.floor((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const dayName = now.toLocaleDateString('pt-BR', { weekday: 'long' })
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })
  const seq = postSequence ?? Math.floor(Math.random() * 1000)

  return `DATA DE REFERÊNCIA (para gerar conteúdo único, não publicar a data): semana ${weekNumber} de ${now.getFullYear()}, ${dayName}, ${monthName}. Sequência interna: ${seq}. Use esses dados como semente de variação — o post deve ter ângulo, exemplo ou abordagem distintos de outros posts da mesma semana.`
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
  postSequence?: number  // contador sequencial por org para seed de diversidade
  keywordOpportunities?: string[]  // keywords da inteligencia competitiva (uso interno, nunca exibidas ao usuario)
  styleExamples?: string[]  // posts publicados anteriores para aprender tom e estilo
}): Promise<GeneratedPost> {
  const { postType, specialty, professionalName, city, neighborhood, tone, recentReview, serviceAreas, postSequence, keywordOpportunities, styleExamples } = params

  const ctx = getEngineContext(specialty)

  // Labels de post adaptados por vertical
  const postTypeLabel: Record<PostType, string> = {
    educativo: `post educativo sobre ${ctx.postKeywords.split(',')[0].trim()}`,
    procedimento: 'destaque de procedimento ou técnica',
    bairro: 'conteúdo de bairro/localização',
    review_highlight: 'destaque de avaliação positiva',
    equipe: `bastidores da equipe ou ${ctx.vocab.local}`,
  }

  const toneInstructions: Record<ReviewTone, string> = {
    formal: 'Tom formal e profissional. Linguagem cuidada e respeitosa.',
    proximo: 'Tom próximo e acolhedor. Use "você" com naturalidade. Quase como conversar com um amigo de confiança.',
    tecnico: 'Tom técnico e informativo. Pode usar termos da área, mas explique-os brevemente.',
  }

  const locationContext = neighborhood
    ? `${neighborhood}, ${city}`
    : city

  const areasContext = serviceAreas?.length
    ? `Áreas de atuação: ${serviceAreas.join(', ')}.`
    : ''

  const typeSpecificInstruction = postType === 'review_highlight' && recentReview
    ? `Use esta avaliação real como base (sem mencionar o nome): "${recentReview}"`
    : postType === 'bairro'
      ? `Mencione naturalmente a localização: ${locationContext}. Conecte o conteúdo com a comunidade local.`
      : ''

  const keywordContext = keywordOpportunities && keywordOpportunities.length > 0
    ? `\nPALAVRAS-CHAVE DE OPORTUNIDADE (incorpore 1-2 naturalmente no texto, sem forçar): ${keywordOpportunities.join(', ')}`
    : ''

  const styleContext = styleExamples && styleExamples.length > 0
    ? `\nESTILO DE REFERÊNCIA: Estes são posts anteriores deste profissional. Mantenha o mesmo tom, vocabulário e forma de se expressar. Não copie, apenas absorva o estilo:\n${styleExamples.map((s, i) => `${i + 1}. "${s}"`).join('\n')}`
    : ''

  const diversityContext = getDiversityContext(postSequence)

  // Regras de compliance: apenas para verticais reguladas (saúde, jurídico)
  const complianceSection = ctx.complianceRules
    ? `\nREGRAS DE COMPLIANCE OBRIGATÓRIAS:\n${ctx.complianceRules}\n- NUNCA mencione preços, valores ou promoções\n- NUNCA prometa resultados ("garantido", "elimina o problema")\n- NUNCA use linguagem sensacionalista ou comparativa\n- NUNCA mencione "o melhor", "o único", "o mais barato"\n- Use linguagem informativa, educativa e acolhedora\n- O post deve soar como se o PRÓPRIO PROFISSIONAL tivesse escrito, não uma IA\n- NUNCA use travessão (—)\n- SEMPRE termine o post com um CTA claro e curto\n`
    : `\nREGRAS GERAIS:\n- NUNCA mencione preços, valores ou promoções\n- NUNCA faça promessas impossíveis\n- NUNCA denigra concorrentes\n- Use linguagem informativa e acolhedora\n- O post deve soar como se o PRÓPRIO PROFISSIONAL tivesse escrito, não uma IA\n- NUNCA use travessão (—)\n- SEMPRE termine o post com um CTA claro e curto\n`

  const prompt = `Você é ${professionalName}, ${ctx.vocab.profissional} em ${city}.

Escreva um ${postTypeLabel[postType]} para o Google Business Profile.

CONTEXTO:
- Palavras-chave do segmento: ${ctx.postKeywords}
- Localização: ${locationContext}
- ${areasContext}
- ${typeSpecificInstruction}

TOM: ${toneInstructions[tone]}
${keywordContext}
${styleContext}

${diversityContext}

FORMATO DO POST:
- Entre 150 e 300 caracteres (ideal para GBP)
- Sem hashtags
- Sem emojis em excesso (máximo 1-2 se o tom for próximo)
- Terminar com uma chamada suave para ação (ex: "Agende seu atendimento", "Fale conosco", "Saiba mais")
${complianceSection}
Retorne um JSON com esta estrutura:
{
  "content": "texto do post",
  "photo_suggestion": "descrição objetiva do tipo de foto ideal para acompanhar este post (ex: 'foto da recepção iluminada com plantas')",
  "compliance_passed": true/false,
  "compliance_notes": "se compliance_passed for false, explique o problema"
}

Retorne APENAS o JSON, sem texto adicional.`

  const systemPrompt = `Você é ${ctx.systemPromptRole}, com profundo conhecimento de SEO local e boas práticas de comunicação digital. Cria conteúdo que engaja ${ctx.vocab.clientes} sem violar nenhuma regra de publicidade. Nunca use travessão (—).`

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

      // Segunda passagem: validação independente (Correção A)
      // O modelo não valida seu próprio output de forma confiável.
      const externalCheck = await validateCompliance(parsed.content, specialty)
      const finalCompliancePassed = parsed.compliance_passed && externalCheck.passed

      return {
        content: parsed.content,
        photo_suggestion: parsed.photo_suggestion,
        post_type: postType,
        compliance_passed: finalCompliancePassed,
        compliance_notes: !finalCompliancePassed
          ? (externalCheck.violations.join('; ') || parsed.compliance_notes)
          : undefined,
      }
    }
  } catch {
    // fallback abaixo
  }

  return getFallbackPost(postType, specialty, city, tone)
}

function getFallbackPost(postType: PostType, specialty: string, city: string, tone: ReviewTone): GeneratedPost {
  const ctx = getEngineContext(specialty)

  const greetings: Record<ReviewTone, string> = {
    formal: `Prezados ${ctx.vocab.clientes}`,
    proximo: 'Olá',
    tecnico: 'Informativo',
  }

  const fallbackContent: Record<PostType, string> = {
    educativo: `${greetings[tone]}, cuidar da sua saúde e bem-estar faz toda a diferença. ${ctx.vocab.atendimento.charAt(0).toUpperCase() + ctx.vocab.atendimento.slice(1)}s regulares ajudam a prevenir problemas. Agende o seu!`,
    procedimento: `Encontre qualidade e dedicação em ${city}. Conheça nossos serviços e agende uma avaliação.`,
    bairro: `Atendendo com cuidado e atenção em ${city}. Estamos aqui para ajudar. Fale conosco!`,
    review_highlight: `Fico muito feliz com o carinho dos nossos ${ctx.vocab.clientes}. Obrigado pela confiança! Agende seu ${ctx.vocab.atendimento}.`,
    equipe: `Nossa equipe está pronta para oferecer o melhor atendimento no nosso ${ctx.vocab.local} em ${city}. Venha nos conhecer!`,
  }

  return {
    content: fallbackContent[postType],
    photo_suggestion: `foto da fachada ou interior do ${ctx.vocab.local} com boa iluminação`,
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
