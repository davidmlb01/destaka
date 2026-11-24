// WhatsApp Review Automation: deteccao de consulta
// Transforma mensagem em (no maximo) um evento de agenda.
// Prefere deixar de detectar a detectar errado.
// REGRA: telefone e nome NUNCA sao enviados ao modelo.

import Anthropic from '@anthropic-ai/sdk'
import { logger } from '@/lib/logger'

// ============================================================
// Tipos
// ============================================================

export interface DetectionInput {
  text: string
  direction: 'clinic' | 'patient'
  message_timestamp: Date
  timezone: string
}

export interface DetectionResult {
  event: 'scheduled' | 'rescheduled' | 'cancelled' | 'none'
  appointment_date: string | null  // YYYY-MM-DD
  appointment_time: string | null  // HH:MM
  confidence: number               // 0 a 1
}

const NONE_RESULT: DetectionResult = {
  event: 'none',
  appointment_date: null,
  appointment_time: null,
  confidence: 0,
}

// ============================================================
// Passo 1: Filtro barato de keywords
// ============================================================

const AGENDA_TERMS = [
  'consulta', 'agendado', 'agendada', 'agendamento',
  'confirmado', 'confirmada', 'marcado', 'marcada',
  'horário', 'horario', 'retorno', 'avaliação', 'avaliacao',
  'sessão', 'sessao', 'atendimento',
]

const CANCEL_TERMS = [
  'desmarcar', 'cancelar', 'remarcar', 'adiar',
  'não vou poder', 'nao vou poder',
  'não consigo ir', 'nao consigo ir',
  'imprevisto',
]

// Padroes de data/hora
const DATE_PATTERNS = [
  /\d{1,2}\/\d{1,2}/,                          // 12/11, 5/12
  /dia\s+\d{1,2}/i,                             // dia 12
  /\d{1,2}h/i,                                  // 14h, 9h
  /\d{1,2}:\d{2}/,                              // 14:30
  /\d{1,2}\s*(da tarde|da manha|da noite)/i,    // 2 da tarde
  /às\s+\d/i,                                   // às 14
  /as\s+\d/i,                                   // as 14 (sem acento)
]

const RELATIVE_DATE_TERMS = [
  'hoje', 'amanhã', 'amanha', 'depois de amanhã', 'depois de amanha',
  'segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta', 'sábado', 'sabado', 'domingo',
  'semana que vem', 'próxima semana', 'proxima semana',
  'segunda-feira', 'terça-feira', 'terca-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira',
]

export function passesKeywordFilter(text: string): boolean {
  const lower = text.toLowerCase()

  // Precisa de pelo menos um termo de agenda OU um termo de cancelamento
  const hasAgendaTerm = AGENDA_TERMS.some(t => lower.includes(t))
  const hasCancelTerm = CANCEL_TERMS.some(t => lower.includes(t))

  if (!hasAgendaTerm && !hasCancelTerm) return false

  // Precisa de pelo menos uma referencia de data/hora
  const hasDatePattern = DATE_PATTERNS.some(p => p.test(text))
  const hasRelativeDate = RELATIVE_DATE_TERMS.some(t => lower.includes(t))

  // Cancelamentos podem nao ter data explicita ("preciso desmarcar a consulta")
  if (hasCancelTerm) return true

  return hasDatePattern || hasRelativeDate
}

// ============================================================
// Passo 2: Extracao via LLM
// ============================================================

const SYSTEM_PROMPT = `Você é um extrator de eventos de agenda a partir de mensagens de WhatsApp entre clínicas e pacientes.

Sua tarefa: identificar se a mensagem contém uma confirmação, remarcação ou cancelamento de consulta.

Regras:
- Retorne APENAS JSON válido, sem markdown, sem explicação.
- Se não houver evento de agenda claro, retorne event: "none".
- Orçamento, dúvida sobre horários disponíveis e lembrete genérico sem data são "none".
- Resolva datas relativas (amanhã, quinta que vem) contra a data da mensagem fornecida.
- Se a data estiver no passado ou a mais de 120 dias no futuro, retorne "none".
- confidence: 0.0 a 1.0. Use 0.9+ apenas quando data e tipo de evento são inequívocos.

Formato de resposta:
{"event":"scheduled|rescheduled|cancelled|none","appointment_date":"YYYY-MM-DD ou null","appointment_time":"HH:MM ou null","confidence":0.0}`

function buildUserPrompt(input: DetectionInput): string {
  const dateStr = input.message_timestamp.toLocaleDateString('pt-BR', {
    timeZone: input.timezone,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return `Data e hora da mensagem: ${dateStr}
Direção: ${input.direction === 'clinic' ? 'enviada pela clínica' : 'enviada pelo paciente'}
Texto: ${input.text}`
}

// Dependencia injetavel para testes
export type LLMExtractor = (input: DetectionInput) => Promise<DetectionResult>

let _anthropic: Anthropic | null = null
function getClient(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  return _anthropic
}

export async function llmExtract(input: DetectionInput): Promise<DetectionResult> {
  const client = getClient()

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(input) }],
    })

    const block = response.content[0]
    if (block.type !== 'text') return NONE_RESULT

    return parseExtractionResponse(block.text, input)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown'
    logger.error('wa-detection', `Erro na extracao LLM: ${msg}`)
    return NONE_RESULT
  }
}

// ============================================================
// Parser da resposta do LLM
// ============================================================

export function parseExtractionResponse(
  raw: string,
  input: DetectionInput
): DetectionResult {
  try {
    // Limpar markdown se houver
    let cleaned = raw.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }

    const parsed = JSON.parse(cleaned)

    // Validar campos
    const validEvents = ['scheduled', 'rescheduled', 'cancelled', 'none']
    if (!validEvents.includes(parsed.event)) return NONE_RESULT

    if (parsed.event === 'none') return NONE_RESULT

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0

    // Validar data
    let appointmentDate = parsed.appointment_date ?? null
    if (appointmentDate) {
      // Validar formato YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
        appointmentDate = null
      } else {
        // Checar se a data e valida e nao esta no passado ou >120 dias
        const dateObj = new Date(appointmentDate + 'T12:00:00')
        const msgDate = new Date(input.message_timestamp)
        msgDate.setHours(0, 0, 0, 0)

        const diffDays = (dateObj.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24)

        if (diffDays < -1 || diffDays > 120) {
          return NONE_RESULT
        }
      }
    }

    // Sem data = none (exceto cancelamento que pode ser generico)
    if (!appointmentDate && parsed.event !== 'cancelled') {
      return NONE_RESULT
    }

    // Validar hora
    let appointmentTime = parsed.appointment_time ?? null
    if (appointmentTime && !/^\d{2}:\d{2}$/.test(appointmentTime)) {
      appointmentTime = null
    }

    return {
      event: parsed.event,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      confidence,
    }
  } catch {
    logger.warn('wa-detection', 'Resposta LLM nao parseavel')
    return NONE_RESULT
  }
}

// ============================================================
// Pipeline completa: filtro + extracao
// ============================================================

export async function detectAppointment(
  input: DetectionInput,
  extractor: LLMExtractor = llmExtract
): Promise<DetectionResult> {
  // Passo 1: filtro barato
  if (!passesKeywordFilter(input.text)) {
    return NONE_RESULT
  }

  // Passo 2: extracao via LLM (ou mock em testes)
  const result = await extractor(input)

  return result
}
