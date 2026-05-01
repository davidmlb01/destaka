// =============================================================================
// DESTAKA — Optimization Planner & Executor
// Story 1.3 — Motor de Otimização Automática
// =============================================================================

import type { GmbProfileData, ScoreResult } from './scorer'
import { calculateScore } from './scorer'
import { getAnthropic, AI_MODEL_FAST } from '@/lib/ai'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionType =
  | 'update_hours'
  | 'update_categories'
  | 'update_attributes'
  | 'update_description'
  | 'add_services'

export interface OptimizationAction {
  type: ActionType
  label: string
  description: string
  impact: number          // pontos que vai recuperar no score
  payload?: Record<string, unknown>
}

export interface OptimizationPlan {
  actions: OptimizationAction[]
  currentScore: number
  projectedScore: number
}

export interface ExecutionResult {
  action: OptimizationAction
  status: 'done' | 'failed'
  payload?: Record<string, unknown>
  error?: string
}

export interface OptimizationResult {
  results: ExecutionResult[]
  scoreBefore: number
  scoreAfter: number
}

// ---------------------------------------------------------------------------
// Planner
// Deriva ações a partir dos issues do diagnóstico
// ---------------------------------------------------------------------------

export function buildOptimizationPlan(
  profile: GmbProfileData,
  score: ScoreResult
): OptimizationPlan {
  const actions: OptimizationAction[] = []

  // Informações
  if (!profile.hasHours) {
    actions.push({
      type: 'update_hours',
      label: 'Definir horário de funcionamento',
      description: 'Horário padrão para dias úteis (08:00–18:00) e sábado (08:00–12:00).',
      impact: 5,
    })
  }

  if (!profile.hasCategory) {
    actions.push({
      type: 'update_categories',
      label: 'Configurar categorias do negócio',
      description: 'Adicionar categorias secundárias relevantes para o segmento.',
      impact: 2,
    })
  }

  // Atributos
  if (profile.attributesCount < 5) {
    actions.push({
      type: 'update_attributes',
      label: 'Adicionar atributos do estabelecimento',
      description: 'Wi-Fi, estacionamento, acessibilidade, formas de pagamento e outros.',
      impact: 5,
    })
  }

  // Descrição (gerada por Claude)
  actions.push({
    type: 'update_description',
    label: 'Gerar descrição profissional do negócio',
    description: 'Claude cria uma descrição otimizada para SEO local, específica para o segmento.',
    impact: 3,
  })

  // Serviços (gerados por Claude)
  if (profile.servicesCount < 3) {
    actions.push({
      type: 'add_services',
      label: 'Adicionar serviços com descrição',
      description: 'Claude gera lista de serviços com descrições claras para pacientes.',
      impact: 10,
    })
  }

  const currentScore = score.total
  const projectedGain = actions.reduce((sum, a) => sum + a.impact, 0)
  const projectedScore = Math.min(100, currentScore + projectedGain)

  return { actions, currentScore, projectedScore }
}

// ---------------------------------------------------------------------------
// Executor
// Executa cada ação — geração de conteúdo via Claude, API calls mockadas
// ---------------------------------------------------------------------------

export async function executeAction(
  action: OptimizationAction,
  profile: GmbProfileData
): Promise<ExecutionResult> {
  try {
    switch (action.type) {
      case 'update_description': {
        const text = await generateDescription(profile)
        return { action, status: 'done', payload: { description: text } }
      }

      case 'add_services': {
        const services = await generateServices(profile)
        return { action, status: 'done', payload: { services } }
      }

      case 'update_hours':
        return {
          action,
          status: 'done',
          payload: {
            hours: {
              monday: '08:00-18:00',
              tuesday: '08:00-18:00',
              wednesday: '08:00-18:00',
              thursday: '08:00-18:00',
              friday: '08:00-18:00',
              saturday: '08:00-12:00',
              sunday: 'closed',
            },
          },
        }

      case 'update_categories':
        return {
          action,
          status: 'done',
          payload: { categories: categoriesForSegment(profile.category) },
        }

      case 'update_attributes':
        return {
          action,
          status: 'done',
          payload: {
            attributes: [
              'Acessível para cadeirantes',
              'Estacionamento disponível',
              'Aceita cartão de crédito',
              'Aceita cartão de débito',
              'Wi-Fi gratuito',
            ],
          },
        }

      default:
        return { action, status: 'failed', error: 'Tipo de ação desconhecido' }
    }
  } catch (err) {
    return {
      action,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    }
  }
}

// Recalcula score simulando o perfil após otimizações aplicadas
export function scoreAfterOptimizations(
  profile: GmbProfileData,
  results: ExecutionResult[]
): number {
  const updated: GmbProfileData = { ...profile }

  for (const r of results) {
    if (r.status !== 'done') continue
    switch (r.action.type) {
      case 'update_hours':
        updated.hasHours = true
        break
      case 'update_categories':
        updated.hasCategory = true
        break
      case 'update_attributes':
        updated.attributesCount = 5
        break
      case 'add_services':
        updated.servicesCount = 3
        updated.servicesWithDescCount = 3
        break
      // update_description não muda nenhum campo do score diretamente
    }
  }

  return calculateScore(updated).total
}

// ---------------------------------------------------------------------------
// Claude helpers
// ---------------------------------------------------------------------------

async function generateDescription(profile: GmbProfileData): Promise<string> {
  const segment = detectSegment(profile.category)

  const message = await getAnthropic().messages.create({
    model: AI_MODEL_FAST,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Escreva uma descrição de negócio para o Google Meu Negócio de um(a) ${segment} brasileiro(a).

Nome do estabelecimento: ${profile.locationName}

Requisitos:
- Máximo 750 caracteres
- Destaque localização, especialidade e diferenciais
- Tom profissional e acolhedor
- Inclua convite para agendar consulta
- Sem travessão (use vírgula ou dois-pontos)
- Sem emojis
- Apenas o texto da descrição, sem título`,
      },
    ],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text.trim() : ''
}

async function generateServices(profile: GmbProfileData): Promise<Array<{ name: string; description: string }>> {
  const segment = detectSegment(profile.category)

  const message = await getAnthropic().messages.create({
    model: AI_MODEL_FAST,
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Liste 4 serviços principais para um(a) ${segment} brasileiro(a) chamado(a) "${profile.locationName}".

Formato JSON (apenas o array, sem markdown):
[
  { "name": "Nome do serviço", "description": "Descrição em até 100 caracteres" },
  ...
]

Regras:
- Nomes curtos (2 a 4 palavras)
- Descrições informativas para pacientes leigos
- Sem travessão`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return []

  try {
    const cleaned = content.text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return [
      { name: 'Consulta', description: 'Atendimento personalizado com avaliação completa.' },
      { name: 'Retorno', description: 'Acompanhamento pós-consulta e ajuste de tratamento.' },
      { name: 'Procedimentos', description: 'Procedimentos especializados conforme necessidade.' },
    ]
  }
}

function detectSegment(category: string): string {
  const lower = category.toLowerCase()
  if (lower.includes('dentista') || lower.includes('odonto')) return 'dentista'
  if (lower.includes('médico') || lower.includes('clinica')) return 'médico'
  if (lower.includes('psicólogo')) return 'psicólogo'
  if (lower.includes('fisioterapia')) return 'fisioterapeuta'
  if (lower.includes('advogado')) return 'advogado'
  return 'profissional de saúde'
}

function categoriesForSegment(category: string): string[] {
  const segment = detectSegment(category)
  const map: Record<string, string[]> = {
    dentista: ['Clínica odontológica', 'Ortodontista', 'Implantodontista'],
    médico: ['Clínica médica', 'Consultório médico', 'Centro de saúde'],
    psicólogo: ['Psicólogo', 'Serviços de saúde mental', 'Terapeuta'],
    fisioterapeuta: ['Fisioterapia', 'Clínica de reabilitação', 'Ortopedia'],
    advogado: ['Escritório de advocacia', 'Consultório jurídico'],
  }
  return map[segment] ?? ['Consultório profissional']
}
