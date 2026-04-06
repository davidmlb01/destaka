// =============================================================================
// DESTAKA — Posts Generator
// Story 1.7 — Posts Automáticos Semanais
// =============================================================================

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export type PostType = 'update' | 'event' | 'offer'

export interface GeneratedPost {
  content: string
  type: PostType
  cta: string
}

// ---------------------------------------------------------------------------
// Contexto sazonal brasileiro por mês
// ---------------------------------------------------------------------------

const SEASONAL_CONTEXT: Record<number, string> = {
  1: 'Janeiro: verão, férias, volta às aulas se aproximando',
  2: 'Fevereiro: carnaval, calor, verão ainda',
  3: 'Março: início do outono, Páscoa se aproximando',
  4: 'Abril: Páscoa, outono, dias mais frescos',
  5: 'Maio: Dia das Mães, outono, gripe sazonal aumentando',
  6: 'Junho: festa junina, inverno, doenças respiratórias',
  7: 'Julho: férias escolares, inverno, gripe e resfriados comuns',
  8: 'Agosto: inverno ainda, Dia dos Pais se aproximando',
  9: 'Setembro: primavera, Dia do Cliente (15/09)',
  10: 'Outubro: primavera, mês do médico (18/10), dengue preventivo',
  11: 'Novembro: calor voltando, novembro azul (saúde do homem)',
  12: 'Dezembro: verão, Natal, fim de ano, férias',
}

// ---------------------------------------------------------------------------
// Prompts por segmento
// ---------------------------------------------------------------------------

const SEGMENT_TOPICS: Record<string, string[]> = {
  dentista: [
    'saúde bucal preventiva',
    'clareamento dental',
    'aparelho e ortodontia',
    'implantes dentários',
    'higiene após refeições',
    'saúde bucal em crianças',
  ],
  médico: [
    'check-up preventivo',
    'controle de pressão arterial',
    'importância do sono',
    'alimentação saudável',
    'vacinação em dia',
    'atividade física',
  ],
  psicólogo: [
    'saúde mental no trabalho',
    'ansiedade e como lidar',
    'terapia online e presencial',
    'autocuidado no dia a dia',
    'relacionamentos saudáveis',
    'burnout: sinais de alerta',
  ],
  fisioterapeuta: [
    'dores nas costas e postura',
    'lesões esportivas',
    'reabilitação pós-cirurgia',
    'pilates e fortalecimento',
    'dores no pescoço e ombro',
    'fisioterapia preventiva',
  ],
  advogado: [
    'direitos do consumidor',
    'planejamento sucessório',
    'contratos e precauções',
    'direitos trabalhistas',
    'consulta jurídica preventiva',
    'documentação imobiliária',
  ],
}

// ---------------------------------------------------------------------------
// Gerador principal
// ---------------------------------------------------------------------------

export async function generateWeeklyPost(
  segment: string,
  businessName: string,
  locationCity?: string
): Promise<GeneratedPost> {
  const month = new Date().getMonth() + 1
  const seasonalCtx = SEASONAL_CONTEXT[month]
  const topics = SEGMENT_TOPICS[segment] ?? SEGMENT_TOPICS['médico']
  const topic = topics[Math.floor(Math.random() * topics.length)]

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Crie um post para o Google Meu Negócio de ${businessName}, um(a) ${segment}${locationCity ? ` em ${locationCity}` : ''}.

Tema do post: ${topic}
Contexto sazonal: ${seasonalCtx}

Responda APENAS com JSON neste formato exato (sem markdown):
{
  "content": "texto do post em até 300 caracteres, sem travessão, sem emojis",
  "type": "update",
  "cta": "frase de call-to-action curta, ex: Agende sua consulta"
}

Regras:
- Linguagem acessível, direta, sem jargões médicos/jurídicos
- Mencione o contexto sazonal se relevante
- O content já deve incluir o CTA no final
- Sem travessão (use vírgula ou dois-pontos)`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return fallbackPost(segment, businessName)
  }

  try {
    const parsed = JSON.parse(content.text.replace(/```json|```/g, '').trim()) as GeneratedPost
    return parsed
  } catch {
    return fallbackPost(segment, businessName)
  }
}

function fallbackPost(segment: string, businessName: string): GeneratedPost {
  return {
    content: `Cuidar da sua saúde é o melhor investimento que você pode fazer. Em ${businessName}, oferecemos atendimento personalizado e humanizado. Agende sua consulta.`,
    type: 'update',
    cta: 'Agende sua consulta',
  }
}

export function detectSegment(category: string): string {
  const lower = category.toLowerCase()
  if (lower.includes('dentista') || lower.includes('odonto')) return 'dentista'
  if (lower.includes('médico') || lower.includes('clinica')) return 'médico'
  if (lower.includes('psicólogo')) return 'psicólogo'
  if (lower.includes('fisio')) return 'fisioterapeuta'
  if (lower.includes('advogado')) return 'advogado'
  return 'médico'
}
