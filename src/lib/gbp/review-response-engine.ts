// Review Response Engine — Story 004
// Gera respostas personalizadas por faixa de estrelas + tom do profissional
// Compliance CFM/CRO: sem promoção de procedimentos, sem promessa de resultado

import { generateContent } from '@/lib/ai/client'

export type ReviewTone = 'formal' | 'proximo' | 'tecnico'

const TONE_DESCRIPTION: Record<ReviewTone, string> = {
  formal: 'formal e profissional, como um médico respeitoso',
  proximo: 'próximo e acolhedor, como um profissional que conhece o paciente pelo nome',
  tecnico: 'técnico e preciso, mas ainda humano e empático',
}

const STAR_STRATEGY: Record<number, string> = {
  5: `Agradecimento genuíno e caloroso. Inclua naturalmente a especialidade e a cidade (ex: "em nossa clínica odontológica em São Paulo"). Convide o paciente a retornar para o próximo procedimento ou check-up. Máximo 3 frases.`,
  4: `Agradeça o feedback. Reconheça sutilmente que há espaço para melhoria sem entrar em detalhes. Convide para a próxima consulta. Máximo 3 frases.`,
  3: `Tome responsabilidade de forma empática sem culpar o paciente. Agradeça por ter compartilhado. Ofereça contato direto para entender melhor e melhorar. Máximo 4 frases.`,
  2: `Tom profissional e empático. Não seja defensivo. Agradeça pelo feedback. Ofereça um canal de contato direto (telefone ou email) para resolver a situação. Não mencione detalhes clínicos. Máximo 4 frases.`,
  1: `Tome responsabilidade sem ser defensivo. Tom calmo e empático. Desescale qualquer tensão. Ofereça contato direto para resolução. Deixe claro que a experiência do paciente é prioridade. Máximo 4 frases.`,
}

const COMPLIANCE_RULES = `
REGRAS DE COMPLIANCE OBRIGATÓRIAS (CFM/CRO/COFFITO):
- NUNCA prometa resultados clínicos específicos
- NUNCA mencione valores, preços ou promoções
- NUNCA cite procedimentos específicos de forma promocional
- NUNCA compare com outros profissionais ou clínicas
- NUNCA use termos que possam ser interpretados como publicidade médica enganosa
- A resposta deve soar como se o PRÓPRIO PROFISSIONAL tivesse escrito, não uma IA
`

export async function generateReviewResponse(params: {
  reviewComment: string
  starRating: number
  professionalName: string
  specialty: string
  city: string
  tone: ReviewTone
}): Promise<string> {
  const { reviewComment, starRating, professionalName, specialty, city, tone } = params

  const stars = Math.max(1, Math.min(5, Math.round(starRating)))
  const strategy = STAR_STRATEGY[stars] ?? STAR_STRATEGY[3]
  const toneDesc = TONE_DESCRIPTION[tone]

  const prompt = `Você é ${professionalName}, ${specialty} em ${city}.

AVALIAÇÃO DO PACIENTE (${stars} estrela${stars > 1 ? 's' : ''}):
"${reviewComment || '(sem comentário — apenas nota)'}"

ESTRATÉGIA PARA ESTA RESPOSTA:
${strategy}

TOM: ${toneDesc}

${COMPLIANCE_RULES}

Escreva a resposta em português brasileiro. Não use travessão (—). Retorne APENAS o texto da resposta, sem aspas, sem prefixos.`

  const systemPrompt = `Você é um especialista em reputação online para profissionais de saúde no Brasil. Escreve respostas a reviews do Google que soam humanas, empáticas e completamente dentro das normas do CFM/CRO. Nunca use travessão (—).`

  try {
    const response = await generateContent(prompt, systemPrompt)
    return response.trim()
  } catch {
    // Fallback por faixa de estrelas
    return getFallbackResponse(stars, professionalName, tone)
  }
}

function getFallbackResponse(stars: number, name: string, tone: ReviewTone): string {
  if (stars === 5) {
    return tone === 'proximo'
      ? `Muito obrigado pelo carinho e por compartilhar sua experiência! É uma alegria cuidar de você. Esperamos te ver em breve!`
      : `Agradecemos imensamente pelo seu feedback e pela confiança depositada em nosso trabalho. Até a próxima consulta!`
  }
  if (stars >= 3) {
    return `Obrigado pelo seu feedback. Sua opinião é muito importante para que possamos continuar melhorando nosso atendimento. Ficamos à disposição.`
  }
  return `Agradecemos por compartilhar sua experiência. Lamentamos que não tenha correspondido às suas expectativas. Por favor, entre em contato conosco diretamente para que possamos entender melhor a situação e ajudá-lo da melhor forma possível.`
}
