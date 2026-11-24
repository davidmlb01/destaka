/**
 * WhatsApp Review Automation: testes de ingestao de webhooks (Fase 3)
 * Run: npx tsx src/lib/__tests__/wa-reviews-webhook.test.ts
 *
 * ACEITE PRINCIPAL: um texto marcador enviado no webhook NAO aparece
 * em nenhuma tabela, log ou resultado persistido.
 *
 * Usa dependency injection (sem banco real, sem monkey-patching).
 */

import type { NormalizedEvent } from '../wa-reviews/provider.js'
import type { PatientContact } from '../wa-reviews/db.js'
import type { WebhookDeps } from '../wa-reviews/webhook-processor.js'
import {
  processWebhookEvent,
  processWebhookBatch,
  isOptOut,
} from '../wa-reviews/webhook-processor.js'

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------
let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++
    console.log(`  OK: ${msg}`)
  } else {
    failed++
    console.error(`  FAIL: ${msg}`)
  }
}

function assertEqual(actual: unknown, expected: unknown, msg: string) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  if (pass) {
    passed++
    console.log(`  OK: ${msg}`)
  } else {
    failed++
    console.error(`  FAIL: ${msg}`)
    console.error(`    expected: ${JSON.stringify(expected)}`)
    console.error(`    actual:   ${JSON.stringify(actual)}`)
  }
}

// ---------------------------------------------------------------------------
// Mock deps (injected, not monkey-patched)
// ---------------------------------------------------------------------------

interface MockState {
  contacts: Map<string, { id: string; display_name: string | null }>
  dedup: Set<string>
  connectionStatus: string
  dbWrites: Array<{ table: string; data: Record<string, unknown> }>
  logs: string[]
}

function createMockState(): MockState {
  return {
    contacts: new Map(),
    dedup: new Set(),
    connectionStatus: 'active',
    dbWrites: [],
    logs: [],
  }
}

function createMockDeps(state: MockState): WebhookDeps {
  return {
    isDuplicate: async (orgId: string, hash: string) => {
      return state.dedup.has(`${orgId}:${hash}`)
    },
    markProcessed: async (orgId: string, hash: string) => {
      state.dedup.add(`${orgId}:${hash}`)
      state.dbWrites.push({ table: 'wa_message_dedup', data: { orgId, hash } })
    },
    upsertContact: async (orgId: string, phone: string, name: string | null) => {
      const id = `contact-${phone}`
      state.contacts.set(id, { id, display_name: name })
      state.dbWrites.push({ table: 'patient_contacts', data: { orgId, phone: '[MASKED]', name } })
      return {
        id,
        organization_id: orgId,
        phone_e164: '[ENCRYPTED]',
        phone_hash: '[HASH]',
        display_name: name,
        first_seen_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        opted_out_at: null,
        opted_out_source: null,
      } as PatientContact
    },
    updateConnectionStatus: async (orgId: string, status: string, extra?: Record<string, unknown>) => {
      state.connectionStatus = status
      state.dbWrites.push({ table: 'whatsapp_connections', data: { orgId, status, ...extra } })
    },
  }
}

// Log capture
const originalLog = console.log
const originalWarn = console.warn
const originalError = console.error
let capturedLogs: string[] = []

function startCapture() {
  capturedLogs = []
  console.log = (...args: unknown[]) => {
    const msg = args.map(a => String(a)).join(' ')
    if (msg.startsWith('  OK:') || msg.startsWith('  FAIL:') ||
        msg.startsWith('---') || msg.startsWith('===') ||
        msg.startsWith('Resultado:') || msg.startsWith('TODOS')) {
      originalLog(...args)
    }
    capturedLogs.push(msg)
  }
  console.warn = (...args: unknown[]) => {
    capturedLogs.push(args.map(a => String(a)).join(' '))
  }
  console.error = (...args: unknown[]) => {
    const msg = args.map(a => String(a)).join(' ')
    if (msg.startsWith('  FAIL:') || msg.startsWith('    ') || msg.startsWith('TESTES') || msg.startsWith('Erro')) {
      originalError(...args)
    }
    capturedLogs.push(msg)
  }
}

function stopCapture() {
  console.log = originalLog
  console.warn = originalWarn
  console.error = originalError
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ORG_ID = 'org-test-001'
const MARKER_TEXT = 'TEXTO_SECRETO_DO_PACIENTE_QUE_NUNCA_DEVE_APARECER_EM_BANCO_OU_LOG_XYZ123'

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
;(async () => {
try {

// --- Test 1: Texto marcador nao persiste ---
console.log('\n--- Texto marcador nao persiste ---')

const s1 = createMockState()
const d1 = createMockDeps(s1)
startCapture()

const markerEvent: NormalizedEvent = {
  type: 'message_received',
  message_id: 'msg-marker-001',
  phone: '+5521999000099',
  contact_name: 'Paciente Teste',
  timestamp: new Date(),
  text: MARKER_TEXT,
  is_group: false,
  is_from_api: false,
  media_type: null,
}

const markerResult = await processWebhookEvent(ORG_ID, markerEvent, d1)

stopCapture()

assertEqual(markerResult.action, 'processed', 'Evento processado')
assert(markerResult.detection_payload !== undefined, 'detection_payload presente (em memoria)')
assertEqual(markerResult.detection_payload!.text, MARKER_TEXT, 'Texto presente APENAS no detection_payload (memoria)')

// Verificar que marker nao aparece nos logs
const markerInLogs = capturedLogs.some(l => l.includes(MARKER_TEXT))
assert(!markerInLogs, 'Texto marcador NAO aparece nos logs')

// Verificar que marker nao aparece nos db writes
const markerInDb = s1.dbWrites.some(w => JSON.stringify(w.data).includes(MARKER_TEXT))
assert(!markerInDb, 'Texto marcador NAO aparece nos db writes')

// Verificar resultado sem payload nao contem marker
const resultClean = { ...markerResult, detection_payload: undefined }
assert(!JSON.stringify(resultClean).includes(MARKER_TEXT), 'Resultado sem payload nao contem marcador')

// --- Test 2: Idempotencia ---
console.log('\n--- Idempotencia ---')

const s2 = createMockState()
const d2 = createMockDeps(s2)

const idempEvent: NormalizedEvent = {
  type: 'echo_sent',
  message_id: 'msg-idemp-001',
  phone: '+5521999000001',
  contact_name: 'Clinica',
  timestamp: new Date(),
  text: 'Sua consulta esta confirmada.',
}

const first = await processWebhookEvent(ORG_ID, idempEvent, d2)
assertEqual(first.action, 'processed', '1o processamento: processed')

const second = await processWebhookEvent(ORG_ID, idempEvent, d2)
assertEqual(second.action, 'duplicate', '2o processamento: duplicate')

// --- Test 3: Grupo ignorado ---
console.log('\n--- Grupo ignorado ---')

const s3 = createMockState()
const d3 = createMockDeps(s3)
startCapture()

const groupEvent: NormalizedEvent = {
  type: 'message_received',
  message_id: 'msg-group-001',
  phone: '+5521999000003',
  contact_name: 'Grupo Familia',
  timestamp: new Date(),
  text: 'Alguem vai no churrasco sabado?',
  is_group: true,
}

const groupResult = await processWebhookEvent(ORG_ID, groupEvent, d3)

stopCapture()

assertEqual(groupResult.action, 'ignored', 'Grupo: ignored')
assertEqual(groupResult.reason, 'group', 'Motivo: group')
assert(!capturedLogs.some(l => l.includes('churrasco')), 'Texto do grupo nao vaza nos logs')

// --- Test 4: API sent ignorado ---
console.log('\n--- API sent ignorado ---')

const s4 = createMockState()
const d4 = createMockDeps(s4)

const apiEvent: NormalizedEvent = {
  type: 'echo_sent',
  message_id: 'msg-api-001',
  phone: '+5521999000001',
  contact_name: null,
  timestamp: new Date(),
  text: 'Template enviado pelo Destaka',
  is_from_api: true,
}

const apiResult = await processWebhookEvent(ORG_ID, apiEvent, d4)
assertEqual(apiResult.action, 'ignored', 'API sent: ignored')
assertEqual(apiResult.reason, 'api_sent', 'Motivo: api_sent')

// --- Test 5: Media sem texto ignorada ---
console.log('\n--- Media sem texto ignorada ---')

const s5 = createMockState()
const d5 = createMockDeps(s5)

const mediaEvent: NormalizedEvent = {
  type: 'message_received',
  message_id: 'msg-media-001',
  phone: '+5521999000004',
  contact_name: 'Carlos',
  timestamp: new Date(),
  text: null,
  media_type: 'image',
}

const mediaResult = await processWebhookEvent(ORG_ID, mediaEvent, d5)
assertEqual(mediaResult.action, 'ignored', 'Media: ignored')
assertEqual(mediaResult.reason, 'media_only', 'Motivo: media_only')

// --- Test 6: Contato criado ---
console.log('\n--- Contato criado ---')

const s6 = createMockState()
const d6 = createMockDeps(s6)
startCapture()

const contactEvent: NormalizedEvent = {
  type: 'echo_sent',
  message_id: 'msg-contact-001',
  phone: '+5521999000010',
  contact_name: 'Joao Silva',
  timestamp: new Date(),
  text: 'Sua consulta esta marcada para sexta.',
}

const contactResult = await processWebhookEvent(ORG_ID, contactEvent, d6)

stopCapture()

assertEqual(contactResult.action, 'processed', 'Contato: processed')
assert(s6.contacts.size === 1, 'Um contato criado')
assertEqual(Array.from(s6.contacts.values())[0].display_name, 'Joao Silva', 'Nome correto')
assert(!s6.dbWrites.some(w => JSON.stringify(w.data).includes('sexta')), 'Texto nao vaza nos db writes')

// --- Test 7: Opt-out detectado ---
console.log('\n--- Opt-out detectado ---')

const s7 = createMockState()
const d7 = createMockDeps(s7)

const optOutEvent: NormalizedEvent = {
  type: 'message_received',
  message_id: 'msg-optout-001',
  phone: '+5521999000005',
  contact_name: 'Ana',
  timestamp: new Date(),
  text: 'SAIR',
}

const optOutResult = await processWebhookEvent(ORG_ID, optOutEvent, d7)
assertEqual(optOutResult.action, 'processed', 'Opt-out: processed')
assertEqual(optOutResult.reason, 'opt_out', 'Motivo: opt_out')
assertEqual(optOutResult.detection_payload, undefined, 'Sem detection_payload')

// Variantes
for (const kw of ['sair', 'PARAR', 'Sair', 'parar', ' SAIR ']) {
  assert(isOptOut(kw), `isOptOut("${kw}") = true`)
}
assert(!isOptOut('nao vou poder'), 'isOptOut("nao vou poder") = false')
assert(!isOptOut(null), 'isOptOut(null) = false')
assert(!isOptOut(''), 'isOptOut("") = false')

// --- Test 8: Evento de conexao ---
console.log('\n--- Evento de conexao ---')

const s8 = createMockState()
const d8 = createMockDeps(s8)

const connEvent: NormalizedEvent = {
  type: 'connection_changed',
  message_id: 'conn-001',
  phone: '+5521988000001',
  contact_name: null,
  timestamp: new Date(),
  text: null,
  connection_status: 'disconnected',
}

const connResult = await processWebhookEvent(ORG_ID, connEvent, d8)
assertEqual(connResult.action, 'processed', 'Conexao: processed')
assertEqual(connResult.reason, 'connection_update', 'Motivo: connection_update')
assertEqual(s8.connectionStatus, 'disconnected', 'Status atualizado')

// Connected
const s8b = createMockState()
const d8b = createMockDeps(s8b)
const connEvent2: NormalizedEvent = {
  type: 'connection_changed',
  message_id: 'conn-002',
  phone: '+5521988000001',
  contact_name: null,
  timestamp: new Date(),
  text: null,
  connection_status: 'connected',
}
await processWebhookEvent(ORG_ID, connEvent2, d8b)
assertEqual(s8b.connectionStatus, 'active', 'Connected -> status active')

// --- Test 9: Status de entrega ---
console.log('\n--- Status de entrega ---')

const s9 = createMockState()
const d9 = createMockDeps(s9)

const statusEvent: NormalizedEvent = {
  type: 'delivery_status',
  message_id: 'status-001',
  phone: '+5521999000001',
  contact_name: null,
  timestamp: new Date(),
  text: null,
  delivery_status: 'delivered',
}

const statusResult = await processWebhookEvent(ORG_ID, statusEvent, d9)
assertEqual(statusResult.action, 'processed', 'Status: processed')
assertEqual(statusResult.reason, 'delivery_status', 'Motivo: delivery_status')

// --- Test 10: Batch ---
console.log('\n--- Batch ---')

const s10 = createMockState()
const d10 = createMockDeps(s10)

const batchEvents: NormalizedEvent[] = [
  { type: 'echo_sent', message_id: 'b-001', phone: '+5521999000001', contact_name: 'C', timestamp: new Date(), text: 'Confirmado.' },
  { type: 'message_received', message_id: 'b-002', phone: '+5521999000002', contact_name: null, timestamp: new Date(), text: null, is_group: true },
  { type: 'delivery_status', message_id: 'b-003', phone: '+5521999000001', contact_name: null, timestamp: new Date(), text: null, delivery_status: 'read' },
]

const batchResults = await processWebhookBatch(ORG_ID, batchEvents, d10)
assertEqual(batchResults.length, 3, 'Batch: 3 resultados')
assertEqual(batchResults[0].action, 'processed', 'Batch[0]: processed')
assertEqual(batchResults[1].action, 'ignored', 'Batch[1]: ignored (grupo)')
assertEqual(batchResults[2].action, 'processed', 'Batch[2]: processed')

// --- Test 11: Direcao ---
console.log('\n--- Direcao ---')

const s11 = createMockState()
const d11 = createMockDeps(s11)

const echoEvt: NormalizedEvent = {
  type: 'echo_sent', message_id: 'dir-001', phone: '+5521999000001',
  contact_name: 'C', timestamp: new Date(), text: 'Confirmado.',
}
const echoRes = await processWebhookEvent(ORG_ID, echoEvt, d11)
assertEqual(echoRes.detection_payload?.direction, 'clinic', 'Echo: direction = clinic')

const patEvt: NormalizedEvent = {
  type: 'message_received', message_id: 'dir-002', phone: '+5521999000001',
  contact_name: 'M', timestamp: new Date(), text: 'Ok!',
}
const patRes = await processWebhookEvent(ORG_ID, patEvt, d11)
assertEqual(patRes.detection_payload?.direction, 'patient', 'Message: direction = patient')

// --- Test 12: detection_payload campos ---
console.log('\n--- detection_payload campos ---')

assert(echoRes.detection_payload !== undefined, 'payload presente')
assert(typeof echoRes.detection_payload!.organization_id === 'string', 'Tem organization_id')
assert(typeof echoRes.detection_payload!.contact_id === 'string', 'Tem contact_id')
assert(typeof echoRes.detection_payload!.text === 'string', 'Tem text')
assert(typeof echoRes.detection_payload!.direction === 'string', 'Tem direction')
assert(echoRes.detection_payload!.message_timestamp instanceof Date, 'Tem message_timestamp como Date')

// ---------------------------------------------------------------------------
// Resultado
// ---------------------------------------------------------------------------
console.log(`\n${'='.repeat(50)}`)
console.log(`Resultado: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('TESTES FALHARAM')
  process.exit(1)
} else {
  console.log('TODOS OS TESTES PASSARAM')
}

} catch (e) {
  console.error('Erro fatal nos testes:', e)
  process.exit(1)
}
})()
