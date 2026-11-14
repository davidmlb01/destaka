// Review Response Engine — Story 004 / 6.4
// Gera respostas personalizadas por faixa de estrelas + tom do profissional
// Compliance CFM/CRO: sem promoção de procedimentos, sem promessa de resultado
// LGPD Art. 11: sanitiza dados antes de entrar no prompt (Correção B)
// Story 6.4: multi-vertical via getEngineContext()

import { generateContent } from '@/lib/ai/client'
import { sanitizePatientData } from '@/lib/ai/prompt-sanitizer'
import { getEngineContext } from '@/lib/vertical-vocab'

export type ReviewTone = 'formal' | 'proximo' | 'tecnico'

const TONE_DESCRIPTION: Record<ReviewTone, string> = {
  formal: 'formal e profissional, linguagem cuidada e respeitosa',
  proximo: 'próximo e acolhedor, como um profissional que conhece o cliente pelo nome',
  tecnico: 'técnico e preciso, mas ainda humano e empático',
}

const STAR_STRATEGY: Record<number, string> = {
  5: `Agradecimento genuíno e caloroso. Inclua naturalmente a especialidade e a cidade (ex: "em nosso escritório em São Paulo"). Convide para o próximo atendimento. Máximo 3 frases.`,
  4: `Agradeça o feedback. Reconheça sutilmente que há espaço para melhoria sem entrar em detalhes. Convide para o próximo atendimento. Máximo 3 frases.`,
  3: `Tome responsabilidade de forma empática sem culpar o cliente. Agradeça por ter compartilhado. Ofereça contato direto para entender melhor e melhorar. Máximo 4 frases.`,
  2: `Tom profissional e empático. Não seja defensivo. Agradeça pelo feedback. Ofereça um canal de contato direto (telefone ou email) para resolver a situação. Máximo 4 frases.`,
  1: `Tome responsabilidade sem ser defensivo. Tom calmo e empático. Desescale qualquer tensão. Ofereça contato direto para resolução. Deixe claro que a experiência do cliente é prioridade. Máximo 4 frases.`,
}

export async function generateReviewResponse(params: {
  reviewComment: string
  starRating: number
  professionalName: string
  reviewerName?: string
  specialty: string
  city: string
  tone: ReviewTone
}): Promise<string> {
  const { reviewComment, starRating, professionalName, reviewerName, specialty, city, tone } = params

  const ctx = getEngineContext(specialty)

  const stars = Math.max(1, Math.min(5, Math.round(starRating)))
  const strategy = STAR_STRATEGY[stars] ?? STAR_STRATEGY[3]
  const toneDesc = TONE_DESCRIPTION[tone]

  // LGPD Art. 11: remove dados pessoais antes de enviar ao LLM (Correção B)
  const sanitizedComment = sanitizePatientData(reviewComment)

  // Detectar genero provavel pelo primeiro nome do reviewer
  const firstName = reviewerName?.split(' ')[0] ?? ''
  const feminineSuffixes = ['a', 'ia', 'na', 'la', 'ra', 'sa', 'za', 'ta', 'da', 'ce', 'ne', 'le', 'ine', 'ene']
  const masculineNames = new Set(['luca', 'josua', 'nikita'])
  const isFeminine = firstName.length > 1
    && !masculineNames.has(firstName.toLowerCase())
    && feminineSuffixes.some(s => firstName.toLowerCase().endsWith(s))
  const genderHint = firstName
    ? `\nNOME DO CLIENTE: ${firstName} (provavel genero ${isFeminine ? 'feminino' : 'masculino'}). Use concordancia de genero adequada (ex: ${isFeminine ? '"acolhida", "satisfeita", "bem-vinda"' : '"acolhido", "satisfeito", "bem-vindo"'}).`
    : ''

  // Regras de compliance: apenas para verticais reguladas
  const complianceSection = ctx.complianceRules
    ? `\nREGRAS DE COMPLIANCE OBRIGATÓRIAS:\n${ctx.complianceRules}\n- NUNCA prometa resultados específicos\n- NUNCA mencione valores, preços ou promoções\n- NUNCA compare com outros profissionais ou estabelecimentos\n- A resposta deve soar como se o PRÓPRIO PROFISSIONAL tivesse escrito, não uma IA\n`
    : `\nREGRAS GERAIS:\n- NUNCA prometa resultados ou garantias\n- NUNCA mencione valores, preços ou promoções\n- NUNCA denigra concorrentes\n- A resposta deve soar como se o PRÓPRIO PROFISSIONAL tivesse escrito, não uma IA\n`

  const prompt = `Você é ${professionalName}, ${ctx.vocab.profissional} em ${city}.

AVALIAÇÃO (${stars} estrela${stars > 1 ? 's' : ''}):
"${sanitizedComment || '(sem comentario, apenas nota)'}"${genderHint}

ESTRATÉGIA PARA ESTA RESPOSTA:
${strategy}

TOM: ${toneDesc}
${complianceSection}
Escreva a resposta em português brasileiro. Não use travessão. Retorne APENAS o texto da resposta, sem aspas, sem prefixos.`

  const systemPrompt = `Você é ${ctx.systemPromptRole}, especializado em reputação online e resposta a avaliações do Google. Escreve respostas que soam humanas, empáticas e dentro das normas de comunicação do setor. Nunca use travessão (—).`

  try {
    const response = await generateContent(prompt, systemPrompt)
    return response.trim()
  } catch {
    // Fallback por faixa de estrelas
    return getFallbackResponse(stars, professionalName, tone, specialty)
  }
}

function getFallbackResponse(stars: number, name: string, tone: ReviewTone, specialty?: string): string {
  const ctx = getEngineContext(specialty)

  if (stars === 5) {
    return tone === 'proximo'
      ? `Muito obrigado pelo carinho e por compartilhar sua experiência! É uma alegria atender você. Esperamos te ver em breve!`
      : `Agradecemos imensamente pelo seu feedback e pela confiança depositada em nosso trabalho. Até o próximo ${ctx.vocab.atendimento}!`
  }
  if (stars >= 3) {
    return `Obrigado pelo seu feedback. Sua opinião é muito importante para que possamos continuar melhorando nosso atendimento. Ficamos à disposição.`
  }
  return `Agradecemos por compartilhar sua experiência. Lamentamos que não tenha correspondido às suas expectativas. Por favor, entre em contato conosco diretamente para que possamos entender melhor a situação e ajudá-lo da melhor forma possível.`
}
