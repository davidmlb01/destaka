/**
 * WhatsApp Review Automation: testes da camada de provedor (Fase 2)
 * Run: npx tsx src/lib/__tests__/wa-reviews-provider.test.ts
 *
 * Testa:
 * 1. FakeProvider: parseEvents para cada tipo de evento
 * 2. FakeProvider: verifyWebhook com assinatura valida e invalida
 * 3. FakeProvider: sendTemplate registra no historico
 * 4. FakeProvider: createSetupLink retorna URL
 * 5. FakeProvider: getConnectionStatus
 * 6. Eventos sinteticos: cobertura de todos os tipos
 * 7. Factory: createReviewProvider
 */

import { FakeProvider, SYNTHETIC_EVENTS } from '../wa-reviews/fake-provider.js'
import { createReviewProvider } from '../wa-reviews/provider.js'
import type { NormalizedEvent } from '../wa-reviews/provider.js'
import type { WhatsAppConnection } from '../wa-reviews/db.js'

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
// Setup
// ---------------------------------------------------------------------------
const provider = new FakeProvider()

const mockConnection: WhatsAppConnection = {
  id: 'conn-001',
  organization_id: 'org-001',
  provider: 'fake',
  provider_account_ref: 'fake-ref',
  phone_number_id: 'fake-phone-id',
  display_phone: '+5521988000001',
  status: 'active',
  last_event_at: new Date().toISOString(),
  connected_at: new Date().toISOString(),
  disconnected_at: null,
}

// ---------------------------------------------------------------------------
// Test: parseEvents — message_received
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: message_received ---')

const msgPayload = { events: [SYNTHETIC_EVENTS.message_received] }
const msgEvents = provider.parseEvents(msgPayload)

assertEqual(msgEvents.length, 1, 'Retorna 1 evento')
assertEqual(msgEvents[0].type, 'message_received', 'Tipo correto: message_received')
assertEqual(msgEvents[0].phone, '+5521999000001', 'Telefone correto')
assertEqual(msgEvents[0].contact_name, 'Maria Teste', 'Nome do contato correto')
assert(msgEvents[0].text !== null, 'Texto presente')
assert(msgEvents[0].text!.includes('confirmado'), 'Texto contem mensagem sintetica')
assertEqual(msgEvents[0].is_group, false, 'Nao e grupo')
assertEqual(msgEvents[0].is_from_api, false, 'Nao e da API')

// ---------------------------------------------------------------------------
// Test: parseEvents — echo_sent
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: echo_sent ---')

const echoPayload = { events: [SYNTHETIC_EVENTS.echo_sent] }
const echoEvents = provider.parseEvents(echoPayload)

assertEqual(echoEvents.length, 1, 'Retorna 1 evento')
assertEqual(echoEvents[0].type, 'echo_sent', 'Tipo correto: echo_sent')
assert(echoEvents[0].text !== null, 'Texto presente no eco')
assert(echoEvents[0].text!.includes('confirmada'), 'Eco contem confirmacao sintetica')

// ---------------------------------------------------------------------------
// Test: parseEvents — delivery_status (sent, delivered, read, failed)
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: delivery_status ---')

for (const statusKey of ['delivery_sent', 'delivery_delivered', 'delivery_read', 'delivery_failed'] as const) {
  const payload = { events: [SYNTHETIC_EVENTS[statusKey]] }
  const events = provider.parseEvents(payload)
  assertEqual(events.length, 1, `${statusKey}: retorna 1 evento`)
  assertEqual(events[0].type, 'delivery_status', `${statusKey}: tipo correto`)
  assert(events[0].text === null, `${statusKey}: sem texto`)

  const expectedStatus = statusKey.replace('delivery_', '')
  assertEqual(events[0].delivery_status, expectedStatus, `${statusKey}: status = ${expectedStatus}`)
}

// ---------------------------------------------------------------------------
// Test: parseEvents — connection_changed
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: connection_changed ---')

const connPayload = { events: [SYNTHETIC_EVENTS.connection_connected] }
const connEvents = provider.parseEvents(connPayload)
assertEqual(connEvents[0].type, 'connection_changed', 'Tipo correto: connection_changed')
assertEqual(connEvents[0].connection_status, 'connected', 'Status: connected')

const disconnPayload = { events: [SYNTHETIC_EVENTS.connection_disconnected] }
const disconnEvents = provider.parseEvents(disconnPayload)
assertEqual(disconnEvents[0].connection_status, 'disconnected', 'Status: disconnected')

// ---------------------------------------------------------------------------
// Test: parseEvents — grupo (is_group = true)
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: grupo ---')

const groupPayload = { events: [SYNTHETIC_EVENTS.group_message] }
const groupEvents = provider.parseEvents(groupPayload)
assertEqual(groupEvents[0].is_group, true, 'is_group = true para mensagem de grupo')

// ---------------------------------------------------------------------------
// Test: parseEvents — API sent (is_from_api = true)
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: API sent ---')

const apiPayload = { events: [SYNTHETIC_EVENTS.api_sent_message] }
const apiEvents = provider.parseEvents(apiPayload)
assertEqual(apiEvents[0].is_from_api, true, 'is_from_api = true para mensagem da API')

// ---------------------------------------------------------------------------
// Test: parseEvents — media (sem texto)
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: media ---')

const mediaPayload = { events: [SYNTHETIC_EVENTS.media_message] }
const mediaEvents = provider.parseEvents(mediaPayload)
assertEqual(mediaEvents[0].text, null, 'Media message: texto null')
assertEqual(mediaEvents[0].media_type, 'image', 'Media type: image')

// ---------------------------------------------------------------------------
// Test: parseEvents — opt-out keyword
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: opt-out ---')

const optOutPayload = { events: [SYNTHETIC_EVENTS.opt_out_keyword] }
const optOutEvents = provider.parseEvents(optOutPayload)
assertEqual(optOutEvents[0].text, 'SAIR', 'Opt-out: texto = SAIR')

// ---------------------------------------------------------------------------
// Test: parseEvents — cancelamento
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: cancelamento ---')

const cancelPayload = { events: [SYNTHETIC_EVENTS.cancellation] }
const cancelEvents = provider.parseEvents(cancelPayload)
assert(cancelEvents[0].text!.includes('desmarcar'), 'Cancelamento: texto contem desmarcar')

// ---------------------------------------------------------------------------
// Test: parseEvents — remarcacao
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: remarcacao ---')

const reschedPayload = { events: [SYNTHETIC_EVENTS.reschedule] }
const reschedEvents = provider.parseEvents(reschedPayload)
assertEqual(reschedEvents[0].type, 'echo_sent', 'Remarcacao: tipo echo_sent (clinica informa)')
assert(reschedEvents[0].text!.includes('remarcada'), 'Remarcacao: texto contem remarcada')

// ---------------------------------------------------------------------------
// Test: parseEvents — multiplos eventos
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: multiplos eventos ---')

const multiPayload = {
  events: [
    SYNTHETIC_EVENTS.message_received,
    SYNTHETIC_EVENTS.echo_sent,
    SYNTHETIC_EVENTS.delivery_sent,
    SYNTHETIC_EVENTS.connection_connected,
  ],
}
const multiEvents = provider.parseEvents(multiPayload)
assertEqual(multiEvents.length, 4, 'Parseia 4 eventos de uma vez')

// ---------------------------------------------------------------------------
// Test: parseEvents — payload invalido
// ---------------------------------------------------------------------------
console.log('\n--- parseEvents: payload invalido ---')

assertEqual(provider.parseEvents(null).length, 0, 'null retorna []')
assertEqual(provider.parseEvents(undefined).length, 0, 'undefined retorna []')
assertEqual(provider.parseEvents({}).length, 0, '{} retorna []')
assertEqual(provider.parseEvents({ events: 'not_array' }).length, 0, 'events nao-array retorna []')

// ---------------------------------------------------------------------------
// Test: verifyWebhook — assinatura valida
// ---------------------------------------------------------------------------
console.log('\n--- verifyWebhook ---')

const signed = FakeProvider.createSignedPayload([SYNTHETIC_EVENTS.message_received])
const isValid = provider.verifyWebhook(signed.headers, signed.body)
assertEqual(isValid, true, 'Assinatura valida retorna true')

// ---------------------------------------------------------------------------
// Test: verifyWebhook — assinatura invalida
// ---------------------------------------------------------------------------
const badSigned = FakeProvider.createBadSignaturePayload([SYNTHETIC_EVENTS.message_received])
const isInvalid = provider.verifyWebhook(badSigned.headers, badSigned.body)
assertEqual(isInvalid, false, 'Assinatura invalida retorna false')

// ---------------------------------------------------------------------------
// Test: verifyWebhook — sem header de assinatura
// ---------------------------------------------------------------------------
const noSig = provider.verifyWebhook({}, '{}')
assertEqual(noSig, false, 'Sem header de assinatura retorna false')

// ---------------------------------------------------------------------------
// Test: sendTemplate — registra no historico (async)
// ---------------------------------------------------------------------------
async function testAsyncMethods() {
  console.log('\n--- sendTemplate ---')

  provider.sentMessages = [] // limpar
  const sendResult = await provider.sendTemplate(
    mockConnection,
    '+5521999000001',
    'pedido_avaliacao_v1',
    { '1': 'Maria', '2': 'Studio Teste', '3': 'https://g.page/review/xxx' }
  )

  assertEqual(sendResult.success, true, 'Envio retorna success = true')
  assert(sendResult.provider_message_id !== null, 'Retorna provider_message_id')
  assert(sendResult.provider_message_id!.startsWith('fake_sent_'), 'ID comeca com fake_sent_')
  assertEqual(provider.sentMessages.length, 1, 'Historico tem 1 envio')
  assertEqual(provider.sentMessages[0].to, '+5521999000001', 'Historico: telefone correto')
  assertEqual(provider.sentMessages[0].templateName, 'pedido_avaliacao_v1', 'Historico: template correto')
  assertEqual(provider.sentMessages[0].variables['1'], 'Maria', 'Historico: variavel 1 correta')

  // ---------------------------------------------------------------------------
  // Test: createSetupLink
  // ---------------------------------------------------------------------------
  console.log('\n--- createSetupLink ---')

  const link = await provider.createSetupLink('org-001')
  assert(link.includes('org-001'), 'Link contem orgId')
  assert(link.startsWith('https://'), 'Link e HTTPS')

  // ---------------------------------------------------------------------------
  // Test: getConnectionStatus
  // ---------------------------------------------------------------------------
  console.log('\n--- getConnectionStatus ---')

  const statusActive = await provider.getConnectionStatus(mockConnection)
  assertEqual(statusActive.connected, true, 'Conexao active = connected true')
  assertEqual(statusActive.phone_number_id, 'fake-phone-id', 'phone_number_id correto')
  assertEqual(statusActive.display_phone, '+5521988000001', 'display_phone correto')

  const disconnConn = { ...mockConnection, status: 'disconnected' as const }
  const statusDisconn = await provider.getConnectionStatus(disconnConn)
  assertEqual(statusDisconn.connected, false, 'Conexao disconnected = connected false')

  const shadowConn = { ...mockConnection, status: 'shadow' as const }
  const statusShadow = await provider.getConnectionStatus(shadowConn)
  assertEqual(statusShadow.connected, true, 'Conexao shadow = connected true (recebe eventos)')
}

// ---------------------------------------------------------------------------
// Test: factory createReviewProvider
// ---------------------------------------------------------------------------
console.log('\n--- createReviewProvider ---')

const fakeProvider = createReviewProvider('fake')
assertEqual(fakeProvider.name, 'fake', 'Factory retorna FakeProvider')

let factoryError = ''
try {
  createReviewProvider('nonexistent')
} catch (e) {
  factoryError = (e as Error).message
}
assert(factoryError.includes('nao implementado'), 'Factory rejeita provedor desconhecido')

// ---------------------------------------------------------------------------
// Test: cobertura de todos os eventos sinteticos
// ---------------------------------------------------------------------------
console.log('\n--- Cobertura de eventos sinteticos ---')

const allKeys = Object.keys(SYNTHETIC_EVENTS)
assertEqual(allKeys.length, 14, `${allKeys.length} eventos sinteticos definidos`)

for (const key of allKeys) {
  const payload = { events: [SYNTHETIC_EVENTS[key]] }
  const events = provider.parseEvents(payload)
  assert(events.length === 1, `${key}: parseia corretamente`)
  assert(events[0].message_id.length > 0, `${key}: tem message_id`)
  assert(events[0].phone.startsWith('+55'), `${key}: telefone E.164 brasileiro`)
  assert(events[0].timestamp instanceof Date, `${key}: timestamp e Date`)
}

// ---------------------------------------------------------------------------
// Run async tests then print resultado
// ---------------------------------------------------------------------------
testAsyncMethods().then(() => {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`Resultado: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    console.error('TESTES FALHARAM')
    process.exit(1)
  } else {
    console.log('TODOS OS TESTES PASSARAM')
  }
}).catch((e) => {
  console.error('Erro nos testes async:', e)
  process.exit(1)
})
