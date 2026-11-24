/**
 * WhatsApp Review Automation: testes de agendamento e envio (Fase 5)
 * Run: npx tsx src/lib/__tests__/wa-reviews-scheduler.test.ts
 *
 * Testa:
 * 1. handleDetectionResult: agenda pedido para evento scheduled
 * 2. handleDetectionResult: cancela evento e request existente
 * 3. handleDetectionResult: remarcacao supersede evento anterior
 * 4. handleDetectionResult: dedup (mesmo contato, mesma data)
 * 5. handleDetectionResult: confianca abaixo do threshold -> skip
 * 6. checkSendGuards: todas as 5 travas + modo sombra
 * 7. calculateSendTime: delay, janela, domingo -> segunda
 * 8. buildTemplateVariables: nome valido vs invalido
 * 9. buildReviewLink: formato correto
 * 10. handleOptOut: registra descadastro
 */

import {
  handleDetectionResult,
  checkSendGuards,
  calculateSendTime,
  buildTemplateVariables,
  buildReviewLink,
  handleOptOut,
} from '../wa-reviews/scheduler.js'
import type { SchedulerDeps } from '../wa-reviews/scheduler.js'
import type { DetectionResult } from '../wa-reviews/detection.js'
import type {
  ReviewSettings,
  WhatsAppConnection,
  PatientContact,
  AppointmentEvent,
  ReviewRequest,
} from '../wa-reviews/db.js'

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------
let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) { passed++; console.log(`  OK: ${msg}`) }
  else { failed++; console.error(`  FAIL: ${msg}`) }
}

function assertEqual(actual: unknown, expected: unknown, msg: string) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) { passed++; console.log(`  OK: ${msg}`) }
  else { failed++; console.error(`  FAIL: ${msg}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`) }
}

// ---------------------------------------------------------------------------
// Mock state and deps factory
// ---------------------------------------------------------------------------

interface MockState {
  events: AppointmentEvent[]
  requests: ReviewRequest[]
  connection: WhatsAppConnection | null
  settings: ReviewSettings
  contact: PatientContact
  recentRequest: boolean
  monthlyCount: number
  eventForDate: boolean
  optedOut: boolean
  superseded: string[]
  cancelledRequests: string[]
}

function defaultMockState(): MockState {
  return {
    events: [],
    requests: [],
    connection: {
      id: 'conn-1', organization_id: 'org-1', provider: 'fake',
      provider_account_ref: null, phone_number_id: 'phone-1',
      display_phone: '+5521988001122', status: 'active',
      last_event_at: null, connected_at: null, disconnected_at: null,
    },
    settings: {
      organization_id: 'org-1', send_delay_days: 1, min_interval_days: 180,
      monthly_cap: 150, send_window_start: '09:00', send_window_end: '18:00',
      timezone: 'America/Sao_Paulo', confidence_threshold: 0.85,
      google_review_url: null,
    },
    contact: {
      id: 'contact-1', organization_id: 'org-1', phone_e164: '[ENC]',
      phone_hash: '[HASH]', display_name: 'Maria Silva',
      first_seen_at: new Date().toISOString(), last_message_at: null,
      opted_out_at: null, opted_out_source: null,
    },
    recentRequest: false,
    monthlyCount: 0,
    eventForDate: false,
    optedOut: false,
    superseded: [],
    cancelledRequests: [],
  }
}

function createMockDeps(state: MockState): SchedulerDeps {
  let eventCounter = 0
  let requestCounter = 0

  return {
    getSettings: async () => state.settings,
    getConnection: async () => state.connection,
    getContactById: async () => state.optedOut
      ? { ...state.contact, opted_out_at: new Date().toISOString(), opted_out_source: 'keyword' as const }
      : state.contact,
    hasRecentRequest: async () => state.recentRequest,
    countMonthlyRequests: async () => state.monthlyCount,
    hasEventForDate: async () => state.eventForDate,
    getNextEventForContact: async () => state.events.length > 0 ? state.events[0] : null,
    createAppointmentEvent: async (_orgId, _contactId, data) => {
      const evt: AppointmentEvent = {
        id: `evt-${++eventCounter}`,
        organization_id: 'org-1',
        contact_id: 'contact-1',
        type: data.type,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        confidence: data.confidence,
        detected_at: new Date().toISOString(),
        superseded_by: null,
      }
      state.events.push(evt)
      return evt
    },
    createReviewRequest: async (_orgId, fields) => {
      const req: ReviewRequest = {
        id: `req-${++requestCounter}`,
        organization_id: 'org-1',
        contact_id: fields.contact_id,
        appointment_event_id: fields.appointment_event_id,
        scheduled_for: fields.scheduled_for,
        status: 'scheduled',
        skip_reason: null,
        provider_message_id: null,
        template_name: null,
        template_category: null,
        sent_at: null,
        delivered_at: null,
        read_at: null,
        clicked_at: null,
        cost_estimate_brl: null,
      }
      state.requests.push(req)
      return req
    },
    skipReviewRequest: async (_orgId, reqId, reason) => {
      const req = state.requests.find(r => r.id === reqId)
      if (req) { req.status = 'skipped'; req.skip_reason = reason }
    },
    updateReviewRequestStatus: async () => {},
    cancelRequestsForEvent: async (_orgId, eventId) => {
      state.cancelledRequests.push(eventId)
    },
    optOutContact: async () => { state.optedOut = true },
    supersedeEvent: async (_orgId, eventId, _byId) => {
      state.superseded.push(eventId)
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

;(async () => {
try {

const ORG = 'org-1'
const CONTACT = 'contact-1'

// --- 1. Agendamento normal ---
console.log('\n--- Agendamento normal ---')

const s1 = defaultMockState()
const d1 = createMockDeps(s1)
const detection1: DetectionResult = {
  event: 'scheduled', appointment_date: '2026-11-28', appointment_time: '14:00', confidence: 0.92,
}

const r1 = await handleDetectionResult(ORG, CONTACT, detection1, new Date(), d1)
assertEqual(r1.action, 'scheduled', 'Resultado: scheduled')
assert(r1.request_id !== undefined, 'Request ID gerado')
assert(r1.event_id !== undefined, 'Event ID gerado')
assertEqual(s1.events.length, 1, '1 evento criado')
assertEqual(s1.requests.length, 1, '1 request criado')
assertEqual(s1.events[0].type, 'scheduled', 'Tipo do evento: scheduled')
assertEqual(s1.events[0].appointment_date, '2026-11-28', 'Data correta')

// --- 2. Cancelamento ---
console.log('\n--- Cancelamento ---')

const s2 = defaultMockState()
// Adicionar evento existente para cancelar
s2.events.push({
  id: 'existing-evt-1', organization_id: ORG, contact_id: CONTACT,
  type: 'scheduled', appointment_date: '2026-11-28', appointment_time: '14:00',
  confidence: 0.92, detected_at: new Date().toISOString(), superseded_by: null,
})
const d2 = createMockDeps(s2)
const detection2: DetectionResult = {
  event: 'cancelled', appointment_date: null, appointment_time: null, confidence: 0.90,
}

const r2 = await handleDetectionResult(ORG, CONTACT, detection2, new Date(), d2)
assertEqual(r2.action, 'skipped', 'Cancelamento: skipped')
assertEqual(r2.skip_reason, 'cancelled', 'Motivo: cancelled')
assert(s2.superseded.includes('existing-evt-1'), 'Evento original superseded')
assert(s2.cancelledRequests.includes('existing-evt-1'), 'Requests do evento cancelados')

// --- 3. Cancelamento sem evento existente ---
console.log('\n--- Cancelamento sem evento ---')

const s3 = defaultMockState()
const d3 = createMockDeps(s3)
const r3 = await handleDetectionResult(ORG, CONTACT, detection2, new Date(), d3)
assertEqual(r3.skip_reason, 'no_event_to_cancel', 'Nada para cancelar')

// --- 4. Remarcacao ---
console.log('\n--- Remarcacao ---')

const s4 = defaultMockState()
s4.events.push({
  id: 'old-evt', organization_id: ORG, contact_id: CONTACT,
  type: 'scheduled', appointment_date: '2026-11-28', appointment_time: '14:00',
  confidence: 0.92, detected_at: new Date().toISOString(), superseded_by: null,
})
const d4 = createMockDeps(s4)
const detection4: DetectionResult = {
  event: 'rescheduled', appointment_date: '2026-12-02', appointment_time: '10:00', confidence: 0.88,
}

const r4 = await handleDetectionResult(ORG, CONTACT, detection4, new Date(), d4)
assertEqual(r4.action, 'scheduled', 'Remarcacao: scheduled')
assert(s4.superseded.includes('old-evt'), 'Evento antigo superseded')
assert(s4.cancelledRequests.includes('old-evt'), 'Requests antigos cancelados')
// Novo evento + evento de remarcacao
assert(s4.events.length >= 2, 'Eventos: original + remarcacao')
assertEqual(s4.requests.length, 1, '1 novo request criado')

// --- 5. Dedup (mesma data) ---
console.log('\n--- Dedup mesma data ---')

const s5 = defaultMockState()
s5.eventForDate = true
const d5 = createMockDeps(s5)

const r5 = await handleDetectionResult(ORG, CONTACT, detection1, new Date(), d5)
assertEqual(r5.action, 'duplicate_event', 'Dedup: duplicate_event')
assertEqual(s5.requests.length, 0, 'Nenhum request criado')

// --- 6. Confianca baixa ---
console.log('\n--- Confianca baixa ---')

const s6 = defaultMockState()
const d6 = createMockDeps(s6)
const lowConf: DetectionResult = {
  event: 'scheduled', appointment_date: '2026-11-28', appointment_time: null, confidence: 0.60,
}

const r6 = await handleDetectionResult(ORG, CONTACT, lowConf, new Date(), d6)
assertEqual(r6.action, 'skipped', 'Low confidence: skipped')
assertEqual(r6.skip_reason, 'low_confidence', 'Motivo: low_confidence')

// --- 7. None detection ---
console.log('\n--- None detection ---')

const s7 = defaultMockState()
const d7 = createMockDeps(s7)
const none: DetectionResult = { event: 'none', appointment_date: null, appointment_time: null, confidence: 0 }

const r7 = await handleDetectionResult(ORG, CONTACT, none, new Date(), d7)
assertEqual(r7.action, 'skipped', 'None: skipped')

// =========================================================================
// checkSendGuards
// =========================================================================

console.log('\n--- Send Guards: tudo ok ---')

const sg1 = defaultMockState()
const sgd1 = createMockDeps(sg1)
const mockRequest: ReviewRequest = {
  id: 'req-test', organization_id: ORG, contact_id: CONTACT,
  appointment_event_id: 'evt-1', scheduled_for: new Date().toISOString(),
  status: 'scheduled', skip_reason: null, provider_message_id: null,
  template_name: null, template_category: null, sent_at: null,
  delivered_at: null, read_at: null, clicked_at: null, cost_estimate_brl: null,
}

const g1 = await checkSendGuards(ORG, mockRequest, sgd1)
assertEqual(g1.can_send, true, 'Tudo ok: pode enviar')

// --- Guard: opted_out ---
console.log('\n--- Guard: opted_out ---')

const sg2 = defaultMockState()
sg2.optedOut = true
const g2 = await checkSendGuards(ORG, mockRequest, createMockDeps(sg2))
assertEqual(g2.can_send, false, 'Opted out: nao pode enviar')
assertEqual(g2.skip_reason, 'opted_out', 'Motivo: opted_out')

// --- Guard: interval ---
console.log('\n--- Guard: interval ---')

const sg3 = defaultMockState()
sg3.recentRequest = true
const g3 = await checkSendGuards(ORG, mockRequest, createMockDeps(sg3))
assertEqual(g3.can_send, false, 'Recent request: nao pode enviar')
assertEqual(g3.skip_reason, 'interval', 'Motivo: interval')

// --- Guard: disconnected ---
console.log('\n--- Guard: disconnected ---')

const sg4 = defaultMockState()
sg4.connection = { ...sg4.connection!, status: 'disconnected' }
const g4 = await checkSendGuards(ORG, mockRequest, createMockDeps(sg4))
assertEqual(g4.can_send, false, 'Disconnected: nao pode enviar')
assertEqual(g4.skip_reason, 'disconnected', 'Motivo: disconnected')

// --- Guard: shadow ---
console.log('\n--- Guard: shadow (modo sombra) ---')

const sg5 = defaultMockState()
sg5.connection = { ...sg5.connection!, status: 'shadow' }
const g5 = await checkSendGuards(ORG, mockRequest, createMockDeps(sg5))
assertEqual(g5.can_send, false, 'Shadow: nao pode enviar')
assertEqual(g5.skip_reason, 'shadow', 'Motivo: shadow')

// --- Guard: cap ---
console.log('\n--- Guard: cap mensal ---')

const sg6 = defaultMockState()
sg6.monthlyCount = 150
const g6 = await checkSendGuards(ORG, mockRequest, createMockDeps(sg6))
assertEqual(g6.can_send, false, 'Cap atingido: nao pode enviar')
assertEqual(g6.skip_reason, 'cap', 'Motivo: cap')

// --- Guard: no connection ---
console.log('\n--- Guard: sem conexao ---')

const sg7 = defaultMockState()
sg7.connection = null
const g7 = await checkSendGuards(ORG, mockRequest, createMockDeps(sg7))
assertEqual(g7.can_send, false, 'Sem conexao: nao pode enviar')
assertEqual(g7.skip_reason, 'disconnected', 'Motivo: disconnected')

// --- Guard: already skipped ---
console.log('\n--- Guard: request ja skipped ---')

const skippedReq = { ...mockRequest, status: 'skipped' as const }
const g8 = await checkSendGuards(ORG, skippedReq, createMockDeps(defaultMockState()))
assertEqual(g8.can_send, false, 'Ja skipped: nao pode enviar')

// =========================================================================
// calculateSendTime
// =========================================================================

console.log('\n--- calculateSendTime ---')

// Normal: consulta dia 28 (sabado), delay 1 -> dia 29 (domingo) -> move para 30 (segunda)
const t1 = calculateSendTime('2026-11-28', 1, '09:00', '18:00', 'America/Sao_Paulo')
assertEqual(t1.getDate(), 30, 'Delay 1 dia (cai domingo): move para segunda 30')
assertEqual(t1.getHours(), 9, 'Inicio da janela: 9h')

// Delay 0: mesmo dia
const t2 = calculateSendTime('2026-11-28', 0, '09:00', '18:00', 'America/Sao_Paulo')
assertEqual(t2.getDate(), 28, 'Delay 0: mesmo dia')

// Cai no domingo -> segunda
// 29/11/2026 e domingo
const t3 = calculateSendTime('2026-11-28', 1, '09:00', '18:00', 'America/Sao_Paulo')
// 28 + 1 = 29. 29/11/2026: vamos verificar o dia da semana
// Na verdade preciso de uma data que caia no domingo
// 06/12/2026 e domingo
const t4 = calculateSendTime('2026-12-05', 1, '10:00', '18:00', 'America/Sao_Paulo')
// 05 + 1 = 06 (domingo) -> move para 07 (segunda)
assertEqual(t4.getDate(), 7, 'Domingo -> segunda: dia 7')
assertEqual(t4.getHours(), 10, 'Janela customizada: 10h')

// =========================================================================
// buildTemplateVariables
// =========================================================================

console.log('\n--- buildTemplateVariables ---')

const tv1 = buildTemplateVariables('Maria Silva', 'Studio Quiro', 'https://destaka.com.br/r/review/123')
assertEqual(tv1.template, 'pedido_avaliacao_v1', 'Template com nome')
assertEqual(tv1.variables['1'], 'Maria', 'Variavel 1: primeiro nome')
assertEqual(tv1.variables['2'], 'Studio Quiro', 'Variavel 2: nome da clinica')
assert(tv1.variables['3'].includes('review/123'), 'Variavel 3: link')

// Sem nome
const tv2 = buildTemplateVariables(null, 'Studio Quiro', 'https://link')
assertEqual(tv2.template, 'pedido_avaliacao_v1_sem_nome', 'Template sem nome')
assertEqual(tv2.variables['1'], 'Studio Quiro', 'Sem nome: variavel 1 = clinica')

// Nome so emoji
const tv3 = buildTemplateVariables('😀', 'Clinica', 'https://link')
assertEqual(tv3.template, 'pedido_avaliacao_v1_sem_nome', 'Emoji: template sem nome')

// Nome vazio
const tv4 = buildTemplateVariables('', 'Clinica', 'https://link')
assertEqual(tv4.template, 'pedido_avaliacao_v1_sem_nome', 'Vazio: template sem nome')

// =========================================================================
// buildReviewLink
// =========================================================================

console.log('\n--- buildReviewLink ---')

const link = buildReviewLink('req-abc-123')
assertEqual(link, 'https://destaka.com.br/r/review/req-abc-123', 'Link correto')

const linkCustom = buildReviewLink('req-xyz', 'https://test.destaka.com.br')
assertEqual(linkCustom, 'https://test.destaka.com.br/r/review/req-xyz', 'Link custom base')

// =========================================================================
// handleOptOut
// =========================================================================

console.log('\n--- handleOptOut ---')

const soOut = defaultMockState()
const doOut = createMockDeps(soOut)
await handleOptOut(ORG, CONTACT, 'keyword', doOut)
assertEqual(soOut.optedOut, true, 'Opt-out registrado')

// =========================================================================
// Resultado
// =========================================================================

console.log(`\n${'='.repeat(50)}`)
console.log(`Resultado: ${passed} passed, ${failed} failed`)
if (failed > 0) { console.error('TESTES FALHARAM'); process.exit(1) }
else { console.log('TODOS OS TESTES PASSARAM') }

} catch (e) { console.error('Erro fatal:', e); process.exit(1) }
})()
