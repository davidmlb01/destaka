/**
 * Multi-vertical test suite — Story 6.13
 *
 * Tests the entire multi-vertical system for 3 business profiles.
 * Run with: npx tsx src/lib/__tests__/multi-vertical.test.ts
 *
 * Pure functions only — no HTTP calls, no DB, no AI API.
 * Files under test:
 *   src/lib/vertical-vocab.ts   (getVocab, getEngineContext, getBrandName)
 *   src/lib/gmb/segment.ts      (detectSegment)
 */

// ---------------------------------------------------------------------------
// Path alias shim — replaces @/* with src/* for tsx direct execution
// ---------------------------------------------------------------------------
import { register } from 'module'
import { pathToFileURL } from 'url'
import { createRequire } from 'module'

// tsx resolves @/* via tsconfig paths automatically — no extra shim needed.
// The imports below rely on tsx being invoked from the project root so that
// tsconfig.json is picked up.

import { getVocab, getEngineContext, getBrandName } from '../vertical-vocab.js'
import { detectSegment } from '../gmb/segment.js'

// ---------------------------------------------------------------------------
// Minimal test harness (no external dependencies)
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0
const failures: string[] = []

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++
    console.log(`  PASS  ${label}`)
  } else {
    failed++
    failures.push(label)
    console.log(`  FAIL  ${label}`)
  }
}

function describe(suiteName: string, fn: () => void): void {
  console.log(`\n${suiteName}`)
  fn()
}

// ---------------------------------------------------------------------------
// Test profiles
// ---------------------------------------------------------------------------

const PROFILES = {
  saude:    { specialty: 'fisioterapeuta', name: 'Studio Paula Bacellar',  category: 'Physiotherapist' },
  flores:   { specialty: 'floricultura',   name: 'A Bela do Dia Flores',   category: 'Florist'         },
  juridico: { specialty: 'advogado',       name: 'Silva & Associados',     category: 'Lawyer'          },
}

// ---------------------------------------------------------------------------
// 1. Vocabulary tests
// ---------------------------------------------------------------------------

describe('1. Vocabulary — getVocab()', () => {
  describe('  saude (fisioterapeuta)', () => {
    const vocab = getVocab(PROFILES.saude.specialty)

    assert(vocab.clientes === 'pacientes',
      'saude: vocab.clientes === "pacientes"')
    assert(vocab.local === 'consultório',
      'saude: vocab.local === "consultório"')
    assert(vocab.tagline.title.includes('pacientes'),
      'saude: tagline.title contains "pacientes"')
    assert(vocab.servicePlaceholders.length >= 3,
      'saude: servicePlaceholders has at least 3 entries')
    assert(vocab.whatsappMessages.length >= 2,
      'saude: whatsappMessages has at least 2 entries')
    assert(vocab.complianceContext !== null,
      'saude: complianceContext is non-null')
  })

  describe('  flores (floricultura)', () => {
    const vocab = getVocab(PROFILES.flores.specialty)

    assert(vocab.clientes !== 'pacientes',
      'flores: vocab.clientes is NOT "pacientes"')
    assert(vocab.clientes === 'clientes',
      'flores: vocab.clientes === "clientes"')
    assert(vocab.local === 'floricultura',
      'flores: vocab.local === "floricultura"')
    assert(!vocab.tagline.title.includes('pacientes'),
      'flores: tagline.title does NOT contain "pacientes"')
    assert(vocab.servicePlaceholders.length >= 3,
      'flores: servicePlaceholders has at least 3 entries')
    assert(vocab.whatsappMessages.length >= 2,
      'flores: whatsappMessages has at least 2 entries')
    assert(vocab.complianceContext === null,
      'flores: complianceContext is null')
  })

  describe('  juridico (advogado)', () => {
    const vocab = getVocab(PROFILES.juridico.specialty)

    assert(vocab.clientes !== 'pacientes',
      'juridico: vocab.clientes is NOT "pacientes"')
    assert(vocab.clientes === 'clientes',
      'juridico: vocab.clientes === "clientes"')
    assert(vocab.local === 'escritório',
      'juridico: vocab.local === "escritório"')
    assert(!vocab.tagline.title.includes('pacientes'),
      'juridico: tagline.title does NOT contain "pacientes"')
    assert(vocab.servicePlaceholders.length >= 3,
      'juridico: servicePlaceholders has at least 3 entries')
    assert(vocab.whatsappMessages.length >= 2,
      'juridico: whatsappMessages has at least 2 entries')
    assert(vocab.complianceContext !== null,
      'juridico: complianceContext is non-null')
  })
})

// ---------------------------------------------------------------------------
// 2. Engine context tests
// ---------------------------------------------------------------------------

describe('2. Engine context — getEngineContext()', () => {
  describe('  saude (fisioterapeuta)', () => {
    const ctx = getEngineContext(PROFILES.saude.specialty)

    assert(ctx.complianceRules !== null,
      'saude: complianceRules is non-null')
    assert((ctx.complianceRules ?? '').includes('CFM'),
      'saude: complianceRules contains "CFM"')
    assert(ctx.placesSearchType === 'health',
      'saude: placesSearchType === "health"')
  })

  describe('  flores (floricultura)', () => {
    const ctx = getEngineContext(PROFILES.flores.specialty)

    assert(!ctx.systemPromptRole.includes('saúde'),
      'flores: systemPromptRole does NOT contain "saúde"')
    assert(ctx.complianceRules === null,
      'flores: complianceRules is null')
    assert(ctx.placesSearchType !== 'health',
      'flores: placesSearchType is NOT "health"')
    assert(!ctx.placesSearchKeyword.includes('saúde'),
      'flores: placesSearchKeyword does NOT contain "saúde"')
    assert(!ctx.placesSearchKeyword.includes('clínica'),
      'flores: placesSearchKeyword does NOT contain "clínica"')
  })

  describe('  juridico (advogado)', () => {
    const ctx = getEngineContext(PROFILES.juridico.specialty)

    assert(!ctx.systemPromptRole.includes('saúde'),
      'juridico: systemPromptRole does NOT contain "saúde"')
    assert(ctx.complianceRules !== null,
      'juridico: complianceRules is non-null')
    assert((ctx.complianceRules ?? '').includes('OAB'),
      'juridico: complianceRules contains "OAB"')
    assert(ctx.placesSearchType !== 'health',
      'juridico: placesSearchType is NOT "health"')
    assert(!ctx.placesSearchKeyword.includes('saúde'),
      'juridico: placesSearchKeyword does NOT contain "saúde"')
  })
})

// ---------------------------------------------------------------------------
// 3. Segment detection tests
// ---------------------------------------------------------------------------

describe('3. Segment detection — detectSegment()', () => {
  const HEALTH_SEGMENTS = new Set(['dentista', 'médico', 'psicólogo', 'psiquiatra', 'fisioterapeuta', 'profissional de saúde'])

  // NOTE: detectSegment matches Portuguese substrings only.
  // English GBP category strings (e.g. "Physiotherapist", "Florist", "Lawyer")
  // fall through to 'negócio local'. This is a known limitation: in production
  // the specialty field (Portuguese) is used instead of the raw GBP category.
  // These tests document the current behavior so a future fix is visible.

  const seg = detectSegment(PROFILES.saude.category) // "Physiotherapist" — no PT match
  assert(seg === 'negócio local',
    `"Physiotherapist" (English) → "negócio local" fallback [KNOWN LIMITATION: needs PT string "fisioterapeuta"] (got "${seg}")`)

  // Portuguese equivalent DOES match correctly
  const segFisioPT = detectSegment('Fisioterapeuta')
  assert(HEALTH_SEGMENTS.has(segFisioPT),
    `"Fisioterapeuta" (PT) → health segment (got "${segFisioPT}")`)

  const segFlorist = detectSegment(PROFILES.flores.category) // "Florist" — no PT match
  assert(segFlorist === 'negócio local',
    `"Florist" (English) → "negócio local" fallback [KNOWN LIMITATION: needs PT string "floricultura"] (got "${segFlorist}")`)

  const segFloristPT = detectSegment('Floricultura')
  assert(segFloristPT === 'floricultura',
    `"Floricultura" (PT) → "floricultura" (got "${segFloristPT}")`)

  const segLawyer = detectSegment(PROFILES.juridico.category) // "Lawyer" — no PT match
  assert(segLawyer === 'negócio local',
    `"Lawyer" (English) → "negócio local" fallback [KNOWN LIMITATION: needs PT string "advogado"] (got "${segLawyer}")`)

  const segAdvPT = detectSegment('Advogado')
  assert(segAdvPT === 'advogado',
    `"Advogado" (PT) → "advogado" (got "${segAdvPT}")`)

  const segMarketing = detectSegment('Marketing Agency')
  assert(segMarketing === 'marketing',
    `"Marketing Agency" → "marketing" (got "${segMarketing}")`)

  const segPhoto = detectSegment('Photography Studio')
  // "Photography Studio" does not contain "fotógrafo"/"fotografia"/"fotografo" — falls to 'negócio local'
  // This test documents the actual behaviour; the category string must be in Portuguese to match.
  const photoOk = segPhoto === 'fotógrafo' || segPhoto === 'negócio local'
  assert(photoOk,
    `"Photography Studio" → fotógrafo or negócio local (got "${segPhoto}")`)

  const segFotosPT = detectSegment('Fotógrafo profissional')
  assert(segFotosPT === 'fotógrafo',
    `"Fotógrafo profissional" → "fotógrafo" (got "${segFotosPT}")`)

  const segUnknown = detectSegment('Artisan Candle Maker')
  assert(segUnknown !== 'saúde' && segUnknown !== 'médico' && segUnknown !== 'fisioterapeuta',
    `Unknown category → NOT a health segment (got "${segUnknown}")`)
  assert(segUnknown === 'negócio local',
    `Unknown category → "negócio local" fallback (got "${segUnknown}")`)
})

// ---------------------------------------------------------------------------
// 4. No health leakage tests
// ---------------------------------------------------------------------------

describe('4. No health leakage — flores and juridico', () => {
  // These terms must NEVER appear in non-health vocab values
  const HEALTH_TERMS = ['paciente', 'consulta', 'consultório', 'CFM', 'CRO', 'COFFITO']

  function vocabValues(specialty: string): string[] {
    const v = getVocab(specialty)
    const strings: string[] = [
      v.clientes,
      v.cliente,
      v.local,
      v.atendimento,
      v.profissional,
      v.volumeLabel,
      v.tagline.title,
      v.tagline.subtitle,
      v.emailFooter,
      v.reviewPageCopy,
      v.postKeywords,
      v.placesSearchKeyword,
      v.auditContext,
      ...v.servicePlaceholders,
      ...v.whatsappMessages.map(m => m.text),
      ...v.whatsappMessages.map(m => m.label),
    ]
    if (v.complianceContext) strings.push(v.complianceContext)
    return strings
  }

  describe('  flores: zero health terms in vocab', () => {
    const vals = vocabValues(PROFILES.flores.specialty)
    for (const term of HEALTH_TERMS) {
      const found = vals.some(v => v.toLowerCase().includes(term.toLowerCase()))
      assert(!found, `flores: vocab does NOT contain "${term}"`)
    }
    // Also check clínica specifically for flores (strict)
    const hasClinica = vals.some(v => v.toLowerCase().includes('clínica'))
    assert(!hasClinica, 'flores: vocab does NOT contain "clínica"')
  })

  describe('  juridico: zero health patient terms in vocab', () => {
    const vals = vocabValues(PROFILES.juridico.specialty)
    // juridico should not have patient/consultation terms
    const patientTerms = ['paciente', 'consultório', 'CFM', 'CRO', 'COFFITO']
    for (const term of patientTerms) {
      const found = vals.some(v => v.toLowerCase().includes(term.toLowerCase()))
      assert(!found, `juridico: vocab does NOT contain "${term}"`)
    }
    // OAB should be in complianceContext (that's correct), but not in UI copy
    const uiVals = vocabValues(PROFILES.juridico.specialty).filter(v => !v.includes('OAB'))
    const hasPacketTerm = uiVals.some(v => v.toLowerCase().includes('paciente'))
    assert(!hasPacketTerm, 'juridico: UI copy (excl. compliance) does NOT contain "paciente"')
  })
})

// ---------------------------------------------------------------------------
// 5. Brand name tests
// ---------------------------------------------------------------------------

describe('5. Brand name — getBrandName()', () => {
  assert(getBrandName(PROFILES.saude.specialty) === 'Destaka Saúde',
    `saude → "Destaka Saúde" (got "${getBrandName(PROFILES.saude.specialty)}")`)

  assert(getBrandName(PROFILES.flores.specialty) === 'Destaka Flores',
    `flores → "Destaka Flores" (got "${getBrandName(PROFILES.flores.specialty)}")`)

  assert(getBrandName(PROFILES.juridico.specialty) === 'Destaka Jurídico',
    `juridico → "Destaka Jurídico" (got "${getBrandName(PROFILES.juridico.specialty)}")`)

  assert(getBrandName(null) === 'Destaka',
    `null → "Destaka" (got "${getBrandName(null)}")`)

  assert(getBrandName(undefined) === 'Destaka',
    `undefined → "Destaka" (got "${getBrandName(undefined)}")`)

  assert(getBrandName('unknown-specialty-xyz') === 'Destaka',
    `unknown specialty → "Destaka" (got "${getBrandName('unknown-specialty-xyz')}")`)
})

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${'='.repeat(60)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failures.length > 0) {
  console.log('\nFailed tests:')
  for (const f of failures) {
    console.log(`  - ${f}`)
  }
  process.exit(1)
} else {
  console.log('All tests passed.')
  process.exit(0)
}
