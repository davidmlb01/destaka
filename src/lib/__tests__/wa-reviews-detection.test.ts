/**
 * WhatsApp Review Automation: testes de deteccao de consulta (Fase 4)
 * Run: npx tsx src/lib/__tests__/wa-reviews-detection.test.ts
 *
 * 60+ mensagens sinteticas em PT-BR cobrindo:
 * - Confirmacoes (clinica e paciente)
 * - Remarcacoes
 * - Cancelamentos
 * - Orcamentos e duvidas (devem ser "none")
 * - Conversas sem relacao com agenda
 * - Datas relativas (amanha, quinta que vem)
 * - Datas absolutas (12/11, dia 25)
 *
 * Aceite: >= 95% dos eventos com confianca alta sao consultas de fato.
 * Errar para menos (nao detectar) e aceitavel; errar para mais NAO.
 */

import {
  passesKeywordFilter,
  parseExtractionResponse,
  detectAppointment,
} from '../wa-reviews/detection.js'
import type { DetectionInput, DetectionResult, LLMExtractor } from '../wa-reviews/detection.js'

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
// Data de referencia para testes: 25/11/2026, segunda-feira
// ---------------------------------------------------------------------------
const REF_DATE = new Date('2026-11-25T10:00:00-03:00')
const TZ = 'America/Sao_Paulo'

function input(text: string, direction: 'clinic' | 'patient' = 'clinic'): DetectionInput {
  return { text, direction, message_timestamp: REF_DATE, timezone: TZ }
}

// ---------------------------------------------------------------------------
// 1. Testes do filtro de keywords (puro, sem LLM)
// ---------------------------------------------------------------------------
console.log('\n--- Filtro de keywords: PASSA (tem agenda + data) ---')

const shouldPass = [
  'Sua consulta está confirmada para amanhã às 14h',
  'Consulta agendada para dia 28 às 10h',
  'Confirmado para quinta-feira 14:30',
  'Sua sessão está marcada para 02/12 às 15h',
  'Atendimento confirmado para segunda',
  'Retorno agendado para sexta às 9h',
  'Horário confirmado: amanhã 16h',
  'Avaliação marcada para 30/11',
  'Agendamento confirmado para depois de amanhã',
  'Preciso desmarcar a consulta de amanhã',
  'Quero cancelar o horário de quinta',
  'Preciso remarcar minha sessão de sexta',
  'Não vou poder ir na consulta de amanhã',
  'Tive um imprevisto, preciso adiar a consulta',
  'Não consigo ir no atendimento de quarta',
  'Consulta remarcada para dia 5/12 às 11h',
  'Agendado retorno para semana que vem',
  'Sessão confirmada para sábado 10h',
]

for (const msg of shouldPass) {
  assert(passesKeywordFilter(msg), `PASSA: "${msg.slice(0, 50)}..."`)
}

console.log('\n--- Filtro de keywords: BLOQUEIA (sem agenda ou sem data) ---')

const shouldBlock = [
  'Bom dia! Tudo bem?',
  'Obrigada pelo atendimento!',
  'Qual o valor da consulta?',
  'Vocês atendem por convênio?',
  'Preciso de um atestado',
  'Meu exame ficou pronto',
  'Pode me enviar a receita?',
  'Boa tarde, gostaria de informações',
  'Quanto custa uma limpeza?',
  'Vocês têm estacionamento?',
  'O doutor atende particular?',
  'Qual o endereço?',
  'Vi vocês no Google, podem me ajudar?',
  'Muito obrigado pelo carinho com meu pet',
  'Aceita Pix?',
  'Oi! Primeira vez que venho aqui',
]

for (const msg of shouldBlock) {
  assert(!passesKeywordFilter(msg), `BLOQUEIA: "${msg.slice(0, 50)}..."`)
}

// Cancelamentos SEM data explícita devem PASSAR (cancelamentos sao aceitos sem data)
console.log('\n--- Filtro: cancelamentos sem data ---')

const cancelNoDate = [
  'Preciso desmarcar a consulta',
  'Quero cancelar meu horário',
  'Não vou poder ir, tive um imprevisto',
  'Preciso remarcar',
]

for (const msg of cancelNoDate) {
  assert(passesKeywordFilter(msg), `PASSA (cancel sem data): "${msg.slice(0, 50)}..."`)
}

// ---------------------------------------------------------------------------
// 2. Testes do parser de resposta LLM
// ---------------------------------------------------------------------------
console.log('\n--- Parser LLM: respostas validas ---')

const inp = input('dummy')

// Confirmacao normal
let parsed = parseExtractionResponse(
  '{"event":"scheduled","appointment_date":"2026-11-26","appointment_time":"14:00","confidence":0.95}',
  inp
)
assertEqual(parsed.event, 'scheduled', 'Parser: scheduled')
assertEqual(parsed.appointment_date, '2026-11-26', 'Parser: data correta')
assertEqual(parsed.appointment_time, '14:00', 'Parser: hora correta')
assert(parsed.confidence === 0.95, 'Parser: confianca correta')

// Cancelamento sem data (aceito)
parsed = parseExtractionResponse(
  '{"event":"cancelled","appointment_date":null,"appointment_time":null,"confidence":0.85}',
  inp
)
assertEqual(parsed.event, 'cancelled', 'Parser: cancelled sem data aceito')

// None
parsed = parseExtractionResponse(
  '{"event":"none","appointment_date":null,"appointment_time":null,"confidence":0.1}',
  inp
)
assertEqual(parsed.event, 'none', 'Parser: none')

// Remarcacao
parsed = parseExtractionResponse(
  '{"event":"rescheduled","appointment_date":"2026-11-28","appointment_time":"10:30","confidence":0.88}',
  inp
)
assertEqual(parsed.event, 'rescheduled', 'Parser: rescheduled')

console.log('\n--- Parser LLM: respostas invalidas ---')

// JSON invalido
parsed = parseExtractionResponse('isto nao e json', inp)
assertEqual(parsed.event, 'none', 'Parser: JSON invalido -> none')

// Markdown wrapping
parsed = parseExtractionResponse(
  '```json\n{"event":"scheduled","appointment_date":"2026-11-26","appointment_time":"14:00","confidence":0.9}\n```',
  inp
)
assertEqual(parsed.event, 'scheduled', 'Parser: JSON com markdown -> parseia ok')

// Evento invalido
parsed = parseExtractionResponse(
  '{"event":"birthday","appointment_date":"2026-11-26","appointment_time":null,"confidence":0.8}',
  inp
)
assertEqual(parsed.event, 'none', 'Parser: evento invalido -> none')

// Data no passado (mais de 1 dia)
parsed = parseExtractionResponse(
  '{"event":"scheduled","appointment_date":"2026-11-20","appointment_time":"14:00","confidence":0.9}',
  inp
)
assertEqual(parsed.event, 'none', 'Parser: data no passado -> none')

// Data muito no futuro (>120 dias)
parsed = parseExtractionResponse(
  '{"event":"scheduled","appointment_date":"2027-06-01","appointment_time":"14:00","confidence":0.9}',
  inp
)
assertEqual(parsed.event, 'none', 'Parser: data >120 dias -> none')

// Scheduled sem data (nao e cancelamento) -> none
parsed = parseExtractionResponse(
  '{"event":"scheduled","appointment_date":null,"appointment_time":"14:00","confidence":0.9}',
  inp
)
assertEqual(parsed.event, 'none', 'Parser: scheduled sem data -> none')

// Confidence fora do range
parsed = parseExtractionResponse(
  '{"event":"scheduled","appointment_date":"2026-11-26","appointment_time":"14:00","confidence":1.5}',
  inp
)
assert(parsed.confidence <= 1, 'Parser: confidence capped em 1')

// Hora com formato errado
parsed = parseExtractionResponse(
  '{"event":"scheduled","appointment_date":"2026-11-26","appointment_time":"2pm","confidence":0.9}',
  inp
)
assertEqual(parsed.appointment_time, null, 'Parser: hora invalida -> null')

// Data com formato errado
parsed = parseExtractionResponse(
  '{"event":"scheduled","appointment_date":"26/11/2026","appointment_time":"14:00","confidence":0.9}',
  inp
)
assertEqual(parsed.event, 'none', 'Parser: data formato errado -> none')

// ---------------------------------------------------------------------------
// 3. Teste da pipeline completa com mock LLM
// ---------------------------------------------------------------------------
console.log('\n--- Pipeline completa com mock LLM ---')

// Mock LLM que retorna resultado determinístico baseado no texto
const mockExtractor: LLMExtractor = async (inp: DetectionInput) => {
  const text = inp.text.toLowerCase()

  // Checar remarcacao e cancelamento ANTES de confirmacao (prioridade)
  if (text.includes('remarc') || text.includes('remarcad')) {
    return { event: 'rescheduled', appointment_date: '2026-11-28', appointment_time: null, confidence: 0.88 }
  }

  if (text.includes('desmarcar') || text.includes('cancelar') || text.includes('imprevisto') ||
      text.includes('não vou poder') || text.includes('nao vou poder') ||
      text.includes('não consigo ir') || text.includes('nao consigo ir') ||
      text.includes('adiar')) {
    return { event: 'cancelled', appointment_date: null, appointment_time: null, confidence: 0.90 }
  }

  // Confirmacoes (depois de checar remarcacao/cancelamento)
  if (text.includes('confirmad') || text.includes('agendad') || text.includes('marcad')) {
    // Buscar data no texto
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/)
    let date = '2026-11-26' // default: amanha

    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0')
      const month = dateMatch[2].padStart(2, '0')
      date = `2026-${month}-${day}`
    } else if (text.includes('amanha') || text.includes('amanhã')) {
      date = '2026-11-26'
    } else if (text.includes('quinta')) {
      date = '2026-11-26' // proxima quinta
    } else if (text.includes('sexta')) {
      date = '2026-11-27'
    } else if (text.includes('segunda')) {
      date = '2026-11-30'
    }

    // Buscar hora
    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?h?/)
    let time: string | null = null
    if (timeMatch) {
      const h = timeMatch[1].padStart(2, '0')
      const m = timeMatch[2] ?? '00'
      if (parseInt(h) >= 7 && parseInt(h) <= 21) {
        time = `${h}:${m}`
      }
    }

    return { event: 'scheduled', appointment_date: date, appointment_time: time, confidence: 0.92 }
  }

  return { event: 'none', appointment_date: null, appointment_time: null, confidence: 0.1 }
}

// ---------------------------------------------------------------------------
// Mensagens sinteticas: confirmacoes (devem ser detected)
// ---------------------------------------------------------------------------

interface TestCase {
  text: string
  direction: 'clinic' | 'patient'
  expected: 'scheduled' | 'rescheduled' | 'cancelled' | 'none'
  label: string
}

const testCases: TestCase[] = [
  // === CONFIRMACOES (clinica) ===
  { text: 'Sua consulta está confirmada para amanhã às 14h', direction: 'clinic', expected: 'scheduled', label: 'Confirmacao clinica amanha 14h' },
  { text: 'Olá Maria! Consulta agendada para 28/11 às 10h. Até lá!', direction: 'clinic', expected: 'scheduled', label: 'Confirmacao clinica data absoluta' },
  { text: 'Confirmado para quinta-feira 14:30. Dr. Silva aguarda você.', direction: 'clinic', expected: 'scheduled', label: 'Confirmacao clinica dia da semana' },
  { text: 'Sua sessão está marcada para 02/12 às 15h', direction: 'clinic', expected: 'scheduled', label: 'Sessao marcada' },
  { text: 'Atendimento confirmado para segunda às 9h', direction: 'clinic', expected: 'scheduled', label: 'Atendimento segunda' },
  { text: 'Retorno agendado para sexta às 9h. Traga os exames.', direction: 'clinic', expected: 'scheduled', label: 'Retorno sexta' },
  { text: 'Horário confirmado: amanhã 16h. Lembre-se de chegar 10min antes.', direction: 'clinic', expected: 'scheduled', label: 'Horario confirmado' },
  { text: 'Avaliação marcada para 30/11 às 11h', direction: 'clinic', expected: 'scheduled', label: 'Avaliacao marcada' },
  { text: 'Agendamento confirmado para depois de amanhã às 8h', direction: 'clinic', expected: 'scheduled', label: 'Depois de amanha' },

  // === CONFIRMACOES (paciente) ===
  { text: 'Oi, confirmado para amanhã às 14h. Obrigada!', direction: 'patient', expected: 'scheduled', label: 'Paciente confirma amanha' },
  { text: 'Ok, agendado. Até quinta!', direction: 'patient', expected: 'scheduled', label: 'Paciente confirma quinta' },
  { text: 'Marcado! Sexta às 10h', direction: 'patient', expected: 'scheduled', label: 'Paciente confirma sexta' },
  { text: 'Perfeito, confirmada a sessão de amanhã', direction: 'patient', expected: 'scheduled', label: 'Paciente confirma sessao' },

  // === REMARCACOES ===
  { text: 'Maria, sua consulta foi remarcada para 28/11 no mesmo horário.', direction: 'clinic', expected: 'rescheduled', label: 'Remarcacao clinica' },
  { text: 'Conseguimos remarcar para quinta que vem, pode ser?', direction: 'clinic', expected: 'rescheduled', label: 'Remarcacao proposta' },
  { text: 'Remarcado para 05/12 às 14h', direction: 'clinic', expected: 'rescheduled', label: 'Remarcado data nova' },

  // === CANCELAMENTOS ===
  { text: 'Preciso desmarcar a consulta de amanhã', direction: 'patient', expected: 'cancelled', label: 'Desmarcar amanha' },
  { text: 'Quero cancelar o horário de quinta', direction: 'patient', expected: 'cancelled', label: 'Cancelar quinta' },
  { text: 'Não vou poder ir na consulta de amanhã', direction: 'patient', expected: 'cancelled', label: 'Nao vou poder' },
  { text: 'Tive um imprevisto, preciso adiar a consulta', direction: 'patient', expected: 'cancelled', label: 'Imprevisto adiar' },
  { text: 'Não consigo ir no atendimento de quarta', direction: 'patient', expected: 'cancelled', label: 'Nao consigo ir' },
  { text: 'Preciso desmarcar a consulta', direction: 'patient', expected: 'cancelled', label: 'Desmarcar sem data' },
  { text: 'Quero cancelar meu horário', direction: 'patient', expected: 'cancelled', label: 'Cancelar sem data' },

  // === NONE: orcamentos e duvidas ===
  { text: 'Qual o valor da consulta?', direction: 'patient', expected: 'none', label: 'Orcamento valor' },
  { text: 'Vocês atendem por convênio?', direction: 'patient', expected: 'none', label: 'Pergunta convenio' },
  { text: 'Quanto custa uma sessão de acupuntura?', direction: 'patient', expected: 'none', label: 'Orcamento acupuntura' },
  { text: 'Vocês têm horário disponível essa semana?', direction: 'patient', expected: 'none', label: 'Disponibilidade' },
  { text: 'Quais os horários livres?', direction: 'patient', expected: 'none', label: 'Horarios livres' },
  { text: 'Funciona no sábado?', direction: 'patient', expected: 'none', label: 'Horario funcionamento' },

  // === NONE: conversas sem relacao ===
  { text: 'Bom dia! Tudo bem?', direction: 'patient', expected: 'none', label: 'Saudacao' },
  { text: 'Obrigada pelo atendimento!', direction: 'patient', expected: 'none', label: 'Agradecimento' },
  { text: 'Meu exame ficou pronto', direction: 'patient', expected: 'none', label: 'Exame pronto' },
  { text: 'Pode me enviar a receita?', direction: 'patient', expected: 'none', label: 'Receita' },
  { text: 'Boa tarde, gostaria de informações', direction: 'patient', expected: 'none', label: 'Informacoes gerais' },
  { text: 'Qual o endereço?', direction: 'patient', expected: 'none', label: 'Endereco' },
  { text: 'Aceita Pix?', direction: 'patient', expected: 'none', label: 'Pagamento' },
  { text: 'Muito obrigado pelo carinho', direction: 'patient', expected: 'none', label: 'Elogio' },
  { text: 'O doutor atende particular?', direction: 'patient', expected: 'none', label: 'Particular' },
  { text: 'Vocês têm estacionamento?', direction: 'patient', expected: 'none', label: 'Estacionamento' },
  { text: 'Vi vocês no Google, podem me ajudar?', direction: 'patient', expected: 'none', label: 'Google discovery' },
  { text: 'Oi! Primeira vez que venho aqui', direction: 'patient', expected: 'none', label: 'Primeira vez' },
  { text: 'Preciso de um atestado', direction: 'patient', expected: 'none', label: 'Atestado' },
  { text: 'Minha filha está com febre, o que faço?', direction: 'patient', expected: 'none', label: 'Urgencia' },
  { text: 'Parabéns pelo trabalho!', direction: 'patient', expected: 'none', label: 'Parabens' },
  { text: 'Alguém pode me ligar?', direction: 'patient', expected: 'none', label: 'Ligar' },
  { text: 'Cheguei! Estou na recepção', direction: 'patient', expected: 'none', label: 'Chegada' },
  { text: 'Vou atrasar 10 minutos', direction: 'patient', expected: 'none', label: 'Atraso' },
  { text: 'Obrigado, até a próxima!', direction: 'patient', expected: 'none', label: 'Despedida' },
  { text: 'Consegue encaixar meu marido também?', direction: 'patient', expected: 'none', label: 'Encaixe' },

  // === CONFIRMACOES extras com formatos variados ===
  { text: 'Consulta confirmada 03/12 14h', direction: 'clinic', expected: 'scheduled', label: 'Data DD/MM hora' },
  { text: 'Agendado seu retorno para amanhã de manhã', direction: 'clinic', expected: 'scheduled', label: 'Retorno amanha manha' },
  { text: 'Sua avaliação está marcada para sábado', direction: 'clinic', expected: 'scheduled', label: 'Avaliacao sabado' },
  { text: 'Sessão agendada 10/12 às 2 da tarde', direction: 'clinic', expected: 'scheduled', label: 'Sessao 2 da tarde' },
  { text: 'Atendimento confirmado dia 15 às 10h', direction: 'clinic', expected: 'scheduled', label: 'Dia 15' },

  // === Lembretes genericos (SEM data, devem ser none) ===
  { text: 'Lembre-se de trazer os exames!', direction: 'clinic', expected: 'none', label: 'Lembrete exames' },
  { text: 'Não esqueça de tomar o remédio', direction: 'clinic', expected: 'none', label: 'Lembrete remedio' },

  // === Emojis e formatacao ===
  { text: 'Consulta confirmada para amanhã 🎉 14h!', direction: 'clinic', expected: 'scheduled', label: 'Com emoji' },
  { text: '*Agendamento* confirmado para _sexta_ 10h', direction: 'clinic', expected: 'scheduled', label: 'Com markdown WA' },

  // === Extras para atingir 60+ mensagens ===
  { text: 'Boa noite, queria saber os preços', direction: 'patient', expected: 'none', label: 'Precos' },
  { text: 'Manda o cardápio por favor', direction: 'patient', expected: 'none', label: 'Cardapio (nao e clinica)' },
  { text: 'Consulta agendada para amanhã, 26/11, às 8h. Jejum de 12h.', direction: 'clinic', expected: 'scheduled', label: 'Confirmacao com instrucao' },
  { text: 'Pronto! Sua avaliação está agendada para segunda 14h', direction: 'clinic', expected: 'scheduled', label: 'Avaliacao agendada segunda' },
]

// Rodar pipeline completa
;(async () => {
try {

console.log(`\n--- Pipeline completa: ${testCases.length} mensagens sinteticas ---`)

let truePositives = 0
let falsePositives = 0
let trueNegatives = 0
let falseNegatives = 0

for (const tc of testCases) {
  const inp = input(tc.text, tc.direction)
  const result = await detectAppointment(inp, mockExtractor)

  const detected = result.event !== 'none'
  const shouldDetect = tc.expected !== 'none'

  if (detected && shouldDetect) {
    // Verificar que o tipo bate
    if (result.event === tc.expected) {
      truePositives++
      assert(true, `TP: ${tc.label}`)
    } else {
      // Detectou mas tipo errado
      falsePositives++
      assert(false, `TIPO ERRADO: ${tc.label} (esperado ${tc.expected}, got ${result.event})`)
    }
  } else if (!detected && !shouldDetect) {
    trueNegatives++
    assert(true, `TN: ${tc.label}`)
  } else if (detected && !shouldDetect) {
    falsePositives++
    assert(false, `FP: ${tc.label} (detectou ${result.event}, esperava none)`)
  } else {
    // Nao detectou mas deveria
    falseNegatives++
    // Falso negativo e aceitavel pelo plano
    console.log(`  SKIP (FN aceitavel): ${tc.label}`)
  }
}

console.log('\n--- Metricas ---')
const total = testCases.length
const totalPositives = truePositives + falsePositives
const precision = totalPositives > 0 ? truePositives / totalPositives : 1
const recall = (truePositives + falseNegatives) > 0
  ? truePositives / (truePositives + falseNegatives) : 1

console.log(`  Total mensagens: ${total}`)
console.log(`  True Positives: ${truePositives}`)
console.log(`  False Positives: ${falsePositives}`)
console.log(`  True Negatives: ${trueNegatives}`)
console.log(`  False Negatives: ${falseNegatives}`)
console.log(`  Precision: ${(precision * 100).toFixed(1)}%`)
console.log(`  Recall: ${(recall * 100).toFixed(1)}%`)

// Aceite: >= 95% dos detectados sao corretos (precision)
assert(precision >= 0.95, `Precision >= 95% (actual: ${(precision * 100).toFixed(1)}%)`)
assert(falsePositives === 0, `Zero falsos positivos (actual: ${falsePositives})`)

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
