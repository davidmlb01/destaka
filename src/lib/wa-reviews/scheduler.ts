// WhatsApp Review Automation: agendamento e envio de pedidos de avaliacao
// Transforma evento de consulta em pedido agendado, com todas as travas.

import { logger } from '@/lib/logger'
import {
  getSettings,
  getConnection,
  getContactById,
  createReviewRequest,
  skipReviewRequest,
  updateReviewRequestStatus,
  hasRecentRequest,
  countMonthlyRequests,
  cancelRequestsForEvent,
  optOutContact,
  createAppointmentEvent,
  getNextEventForContact,
  supersedeEvent,
  hasEventForDate,
} from './db'
import type {
  ReviewSettings,
  WhatsAppConnection,
  PatientContact,
  AppointmentEvent,
  ReviewRequest,
} from './db'
import type { DetectionResult } from './detection'
import type { WhatsAppReviewProvider, SendResult } from './provider'

// ============================================================
// Tipos
// ============================================================

export interface ScheduleResult {
  action: 'scheduled' | 'skipped' | 'duplicate_event'
  request_id?: string
  skip_reason?: string
  event_id?: string
}

export interface SendCheckResult {
  can_send: boolean
  skip_reason?: string
}

// Dependencias injetaveis para testes
export interface SchedulerDeps {
  getSettings: typeof getSettings
  getConnection: typeof getConnection
  getContactById: typeof getContactById
  createReviewRequest: typeof createReviewRequest
  skipReviewRequest: typeof skipReviewRequest
  updateReviewRequestStatus: typeof updateReviewRequestStatus
  hasRecentRequest: typeof hasRecentRequest
  countMonthlyRequests: typeof countMonthlyRequests
  cancelRequestsForEvent: typeof cancelRequestsForEvent
  optOutContact: typeof optOutContact
  createAppointmentEvent: typeof createAppointmentEvent
  getNextEventForContact: typeof getNextEventForContact
  supersedeEvent: typeof supersedeEvent
  hasEventForDate: typeof hasEventForDate
}

const defaultDeps: SchedulerDeps = {
  getSettings, getConnection, getContactById, createReviewRequest,
  skipReviewRequest, updateReviewRequestStatus, hasRecentRequest,
  countMonthlyRequests, cancelRequestsForEvent, optOutContact,
  createAppointmentEvent, getNextEventForContact, supersedeEvent,
  hasEventForDate,
}

// ============================================================
// Passo 3: Gravar evento e agendar pedido
// ============================================================

export async function handleDetectionResult(
  orgId: string,
  contactId: string,
  detection: DetectionResult,
  messageTimestamp: Date,
  deps: SchedulerDeps = defaultDeps
): Promise<ScheduleResult> {
  if (detection.event === 'none') {
    return { action: 'skipped', skip_reason: 'none_detected' }
  }

  const settings = await deps.getSettings(orgId)

  // Checar confianca contra threshold
  if (detection.confidence < settings.confidence_threshold) {
    return { action: 'skipped', skip_reason: 'low_confidence' }
  }

  // Cancelamento: marcar evento anterior como superseded
  if (detection.event === 'cancelled') {
    return handleCancellation(orgId, contactId, deps)
  }

  // Remarcacao: superseder evento anterior + criar novo
  if (detection.event === 'rescheduled') {
    return handleReschedule(orgId, contactId, detection, settings, deps)
  }

  // Scheduled: criar evento e agendar pedido
  if (detection.event === 'scheduled' && detection.appointment_date) {
    return handleScheduled(orgId, contactId, detection, settings, deps)
  }

  return { action: 'skipped', skip_reason: 'invalid_detection' }
}

async function handleCancellation(
  orgId: string,
  contactId: string,
  deps: SchedulerDeps
): Promise<ScheduleResult> {
  const existingEvent = await deps.getNextEventForContact(orgId, contactId)
  if (!existingEvent) {
    return { action: 'skipped', skip_reason: 'no_event_to_cancel' }
  }

  // Criar evento de cancelamento
  const cancelEvent = await deps.createAppointmentEvent(orgId, contactId, {
    type: 'cancelled',
    appointment_date: existingEvent.appointment_date,
    appointment_time: existingEvent.appointment_time,
    confidence: 0.9,
  })

  // Superseder evento original
  await deps.supersedeEvent(orgId, existingEvent.id, cancelEvent.id)

  // Cancelar requests agendados para o evento original
  await deps.cancelRequestsForEvent(orgId, existingEvent.id)

  logger.info('wa-scheduler', 'Consulta cancelada, request cancelado', { orgId, contactId })
  return { action: 'skipped', skip_reason: 'cancelled', event_id: cancelEvent.id }
}

async function handleReschedule(
  orgId: string,
  contactId: string,
  detection: DetectionResult,
  settings: ReviewSettings,
  deps: SchedulerDeps
): Promise<ScheduleResult> {
  // Superseder evento anterior
  const existingEvent = await deps.getNextEventForContact(orgId, contactId)

  // Criar novo evento
  const newEvent = await deps.createAppointmentEvent(orgId, contactId, {
    type: 'rescheduled',
    appointment_date: detection.appointment_date!,
    appointment_time: detection.appointment_time,
    confidence: detection.confidence,
  })

  if (existingEvent) {
    await deps.supersedeEvent(orgId, existingEvent.id, newEvent.id)
    await deps.cancelRequestsForEvent(orgId, existingEvent.id)
  }

  // Agendar novo pedido para a nova data
  return scheduleRequest(orgId, contactId, newEvent, settings, deps)
}

async function handleScheduled(
  orgId: string,
  contactId: string,
  detection: DetectionResult,
  settings: ReviewSettings,
  deps: SchedulerDeps
): Promise<ScheduleResult> {
  // Dedup: mesmo contato, mesma data = um evento so
  const exists = await deps.hasEventForDate(orgId, contactId, detection.appointment_date!)
  if (exists) {
    return { action: 'duplicate_event' }
  }

  // Criar evento
  const event = await deps.createAppointmentEvent(orgId, contactId, {
    type: 'scheduled',
    appointment_date: detection.appointment_date!,
    appointment_time: detection.appointment_time,
    confidence: detection.confidence,
  })

  // Agendar pedido
  return scheduleRequest(orgId, contactId, event, settings, deps)
}

function scheduleRequest(
  orgId: string,
  contactId: string,
  event: AppointmentEvent,
  settings: ReviewSettings,
  deps: SchedulerDeps
): Promise<ScheduleResult> {
  // Calcular data/hora de envio: data da consulta + delay, dentro da janela
  const sendDate = calculateSendTime(
    event.appointment_date,
    settings.send_delay_days,
    settings.send_window_start,
    settings.send_window_end,
    settings.timezone
  )

  return deps.createReviewRequest(orgId, {
    contact_id: contactId,
    appointment_event_id: event.id,
    scheduled_for: sendDate.toISOString(),
  }).then(request => ({
    action: 'scheduled' as const,
    request_id: request.id,
    event_id: event.id,
  }))
}

// ============================================================
// Passo 4: Guardas no momento do envio
// ============================================================

export async function checkSendGuards(
  orgId: string,
  request: ReviewRequest,
  deps: SchedulerDeps = defaultDeps
): Promise<SendCheckResult> {
  // 1. Evento nao foi substituido
  if (request.appointment_event_id) {
    // Verificar via db se o evento foi superseded (appointment_events.superseded_by != null)
    // Como nao temos uma funcao especifica, checar se o request ja foi cancelado
    if (request.status === 'skipped') {
      return { can_send: false, skip_reason: 'already_skipped' }
    }
  }

  // 2. Paciente nao se descadastrou
  const contact = await deps.getContactById(orgId, request.contact_id)
  if (!contact) {
    return { can_send: false, skip_reason: 'contact_not_found' }
  }
  if (contact.opted_out_at) {
    return { can_send: false, skip_reason: 'opted_out' }
  }

  // 3. Sem pedido dentro do intervalo minimo
  const settings = await deps.getSettings(orgId)
  const recent = await deps.hasRecentRequest(orgId, request.contact_id, settings.min_interval_days)
  if (recent) {
    return { can_send: false, skip_reason: 'interval' }
  }

  // 4. Clinica ativa, conectada e fora do modo sombra
  const connection = await deps.getConnection(orgId)
  if (!connection) {
    return { can_send: false, skip_reason: 'disconnected' }
  }
  if (connection.status === 'disconnected' || connection.status === 'pending') {
    return { can_send: false, skip_reason: 'disconnected' }
  }
  if (connection.status === 'shadow') {
    return { can_send: false, skip_reason: 'shadow' }
  }

  // 5. Teto mensal nao atingido
  const monthlyCount = await deps.countMonthlyRequests(orgId)
  if (monthlyCount >= settings.monthly_cap) {
    return { can_send: false, skip_reason: 'cap' }
  }

  return { can_send: true }
}

// ============================================================
// Passo 6: Opt-out
// ============================================================

export async function handleOptOut(
  orgId: string,
  contactId: string,
  source: 'keyword' | 'button',
  deps: SchedulerDeps = defaultDeps
): Promise<void> {
  await deps.optOutContact(orgId, contactId, source)
  logger.info('wa-scheduler', 'Paciente descadastrado', { orgId, contactId, source })
}

// ============================================================
// Helpers
// ============================================================

export function calculateSendTime(
  appointmentDate: string,
  delayDays: number,
  windowStart: string,
  windowEnd: string,
  _timezone: string
): Date {
  // Data base: data da consulta + delay
  const [year, month, day] = appointmentDate.split('-').map(Number)
  const sendDate = new Date(year, month - 1, day)
  sendDate.setDate(sendDate.getDate() + delayDays)

  // Hora: inicio da janela de envio (default 9h)
  const [startH, startM] = windowStart.split(':').map(Number)
  sendDate.setHours(startH, startM, 0, 0)

  // Se cair no domingo, mover para segunda
  if (sendDate.getDay() === 0) {
    sendDate.setDate(sendDate.getDate() + 1)
  }

  return sendDate
}

// Gerar link curto do Destaka para tracking de cliques
export function buildReviewLink(requestId: string, baseUrl: string = 'https://destaka.com.br'): string {
  return `${baseUrl}/r/review/${requestId}`
}

// Template variables para o pedido de avaliacao
export function buildTemplateVariables(
  contactName: string | null,
  orgName: string,
  reviewLink: string
): { template: string; variables: Record<string, string> } {
  const hasValidName = contactName && contactName.trim().length > 1 &&
    !/^[\p{Emoji}]+$/u.test(contactName.trim())

  const template = hasValidName ? 'pedido_avaliacao_v1' : 'pedido_avaliacao_v1_sem_nome'

  const variables: Record<string, string> = hasValidName
    ? { '1': contactName!.split(' ')[0], '2': orgName, '3': reviewLink }
    : { '1': orgName, '2': reviewLink }

  return { template, variables }
}
