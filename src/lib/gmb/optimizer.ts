// =============================================================================
// DESTAKA — Optimization Planner & Executor
// Story 1.3 — Motor de Otimização Automática
// =============================================================================

import type { GmbProfileData, ScoreResult } from './scorer'
import { calculateScore } from './scorer'
import { getAnthropic, AI_MODEL_FAST } from '@/lib/ai'
import { sanitizeForPrompt } from '@/lib/sanitize'
import { patchLocation } from './client'
import { attributesToGbpFormat } from './attributes'
import { detectSegment } from './segment'

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

/** Contexto para escrita real na GBP API. Quando ausente, apenas gera conteúdo. */
export interface GmbWriteContext {
  accessToken: string
  locationName: string  // "accounts/{id}/locations/{id}"
}

/** Dados coletados do profissional no setup inicial. */
export interface ProfileSetup {
  specialty: string
  businessHours: Record<string, { open: string; close: string; closed: boolean }>
  servicesInput: string[]
  attributesSelected: string[]  // IDs dos atributos selecionados
  bio?: string
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
  profile: GmbProfileData,
  gmbWrite?: GmbWriteContext,
  setup?: ProfileSetup
): Promise<ExecutionResult> {
  try {
    switch (action.type) {
      case 'update_description': {
        const text = await generateDescription(profile, setup?.specialty, setup?.servicesInput, setup?.bio)
        // Descrição nunca é aplicada automaticamente — sempre retorna para aprovação no wizard
        return { action, status: 'done', payload: { description: text, applied: false, requiresApproval: true } }
      }

      case 'update_hours': {
        if (!setup?.businessHours) {
          return {
            action,
            status: 'failed',
            error: 'Horários não configurados. Complete o setup do perfil antes de otimizar.',
          }
        }
        // Converte o formato do setup {monday:{open,close,closed}} para {monday:'08:00-18:00'}
        const hours: Record<string, string> = {}
        for (const [day, cfg] of Object.entries(setup.businessHours)) {
          hours[day] = cfg.closed ? 'closed' : `${cfg.open}-${cfg.close}`
        }
        if (gmbWrite) {
          await patchLocation(gmbWrite.accessToken, gmbWrite.locationName, 'regularHours', {
            regularHours: { periods: hoursToGbpPeriods(hours) },
          })
        }
        return { action, status: 'done', payload: { hours, applied: !!gmbWrite } }
      }

      case 'add_services': {
        if (!setup?.servicesInput?.length) {
          return {
            action,
            status: 'failed',
            error: 'Serviços não configurados. Complete o setup do perfil antes de otimizar.',
          }
        }
        const services = await formatServices(setup.servicesInput, setup.specialty ?? profile.category)
        if (gmbWrite) {
          const serviceItems = services.map(s => ({
            freeFormServiceItem: {
              label: {
                displayName: s.name,
                description: s.description,
                languageCode: 'pt',
              },
            },
          }))
          await patchLocation(gmbWrite.accessToken, gmbWrite.locationName, 'serviceItems', {
            serviceItems,
          })
        }
        return { action, status: 'done', payload: { services, applied: !!gmbWrite } }
      }

      // Requer IDs do catálogo GBP (gcid:*) — gera sugestão para ação manual
      case 'update_categories':
        return {
          action,
          status: 'done',
          payload: {
            categories: categoriesForSegment(profile.category),
            applied: false,
            manual: true,
            note: 'Adicione as categorias sugeridas manualmente no painel do Google Meu Negócio.',
          },
        }

      case 'update_attributes': {
        if (!setup?.attributesSelected?.length) {
          return {
            action,
            status: 'done',
            payload: {
              applied: false,
              manual: true,
              note: 'Nenhum atributo selecionado no setup. Configure os atributos do consultório nas configurações do perfil.',
            },
          }
        }
        if (gmbWrite) {
          await patchLocation(gmbWrite.accessToken, gmbWrite.locationName, 'attributes', {
            attributes: attributesToGbpFormat(setup.attributesSelected),
          })
        }
        return {
          action,
          status: 'done',
          payload: {
            attributeIds: setup.attributesSelected,
            applied: !!gmbWrite,
          },
        }
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

// Converte formato interno { monday: '08:00-18:00' } para GBP periods
const GBP_DAYS: Record<string, string> = {
  monday: 'MONDAY', tuesday: 'TUESDAY', wednesday: 'WEDNESDAY',
  thursday: 'THURSDAY', friday: 'FRIDAY', saturday: 'SATURDAY', sunday: 'SUNDAY',
}

function hoursToGbpPeriods(hours: Record<string, string>) {
  const periods = []
  for (const [day, time] of Object.entries(hours)) {
    if (time === 'closed' || !GBP_DAYS[day]) continue
    const [open, close] = time.split('-')
    const [openH, openM] = open.split(':').map(Number)
    const [closeH, closeM] = close.split(':').map(Number)
    periods.push({
      openDay: GBP_DAYS[day],
      openTime: { hours: openH, minutes: openM },
      closeDay: GBP_DAYS[day],
      closeTime: { hours: closeH, minutes: closeM },
    })
  }
  return periods
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

async function generateDescription(
  profile: GmbProfileData,
  specialty?: string,
  servicesInput?: string[],
  bio?: string
): Promise<string> {
  const specialtyLine = specialty
    ? `Especialidade: ${sanitizeForPrompt(specialty)}`
    : `Segmento: ${detectSegment(profile.category)}`

  const servicesLine = servicesInput?.length
    ? `Serviços oferecidos: ${servicesInput.map(s => sanitizeForPrompt(s)).join(', ')}`
    : ''

  const bioLine = bio
    ? `Sobre o profissional: ${sanitizeForPrompt(bio, 500)}`
    : ''

  const message = await getAnthropic().messages.create({
    model: AI_MODEL_FAST,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Escreva uma descrição para o Google Meu Negócio com base nas informações reais abaixo.

Nome do estabelecimento: ${sanitizeForPrompt(profile.locationName)}
${specialtyLine}
${servicesLine}
${bioLine}

Requisitos:
- Máximo 750 caracteres
- Use apenas as informações fornecidas acima. Não invente nada.
- Destaque a especialidade, os serviços reais e os diferenciais informados pelo profissional
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

async function formatServices(
  servicesInput: string[],
  specialty: string
): Promise<Array<{ name: string; description: string }>> {
  const safeServices = servicesInput.map(s => sanitizeForPrompt(s)).join('\n')

  const message = await getAnthropic().messages.create({
    model: AI_MODEL_FAST,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `O profissional informou os seguintes serviços que ele realmente oferece:

${safeServices}

Especialidade: ${sanitizeForPrompt(specialty)}

Para cada serviço, gere um nome curto e uma descrição clara para pacientes leigos.
Use APENAS os serviços listados acima. Não adicione serviços que não foram informados.

Formato JSON (apenas o array, sem markdown):
[
  { "name": "Nome do serviço", "description": "Descrição em até 100 caracteres" },
  ...
]

Regras:
- Nomes curtos (2 a 4 palavras), fiéis ao que foi informado
- Descrições informativas, sem jargão técnico
- Sem travessão`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return servicesInput.map(s => ({ name: s, description: '' }))

  try {
    const cleaned = content.text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return servicesInput.map(s => ({ name: s, description: '' }))
  }
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
