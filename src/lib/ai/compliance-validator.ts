// Compliance Validator — Segunda passagem independente (CORREÇÃO A)
// Valida conteúdo gerado via chamada separada ao Claude.
// O modelo não consegue validar seu próprio output de forma confiável — por isso uma
// chamada independente é necessária como guardrail real.
// Story 6.8: condicional por vertical via getEngineContext()

import { generateContent } from './client'
import { getEngineContext } from '@/lib/vertical-vocab'

export interface ComplianceResult {
  passed: boolean
  violations: string[]
  risk_level: 'ok' | 'warning' | 'block'
}

// Regras universais que se aplicam a TODAS as verticais, independente de regulação
const UNIVERSAL_VIOLATIONS = `
Verifique se o conteúdo viola qualquer uma destas regras universais:
1. Menciona preços, valores, descontos ou promoções
2. Faz promessas impossíveis ou garantias de resultado ("garantido", "certeza absoluta", "100% eficaz")
3. Denigre concorrentes de forma depreciativa
4. Usa superlativos absolutos ("o único no mundo", "o mais barato", "o melhor do Brasil")
5. Contém afirmações enganosas ou que possam induzir o consumidor a erro
`

export async function validateCompliance(content: string, specialty?: string): Promise<ComplianceResult> {
  const ctx = getEngineContext(specialty)

  // Para verticais sem regulação profissional: validar apenas regras universais
  if (!ctx.complianceRules) {
    return validateUniversalRules(content, ctx.vocab.profissional)
  }

  // Para verticais reguladas (saúde, jurídico): validar regras do conselho + universais
  return validateWithProfessionalRules(content, ctx.complianceRules, ctx.vocab.profissional)
}

async function validateUniversalRules(content: string, profissionalLabel: string): Promise<ComplianceResult> {
  const systemPrompt = `Você é um auditor de comunicação digital para ${profissionalLabel}. Analise se o conteúdo respeita boas práticas de comunicação e não contém afirmações enganosas. Retorne APENAS JSON válido.`

  const prompt = `Analise este conteúdo para publicidade de ${profissionalLabel}:

"${content}"

${UNIVERSAL_VIOLATIONS}

Retorne JSON com esta estrutura exata:
{
  "passed": true/false,
  "violations": ["descrição da violação 1", "..."],
  "risk_level": "ok" | "warning" | "block"
}

- "ok": sem violações
- "warning": linguagem ambígua, mas não necessariamente enganosa
- "block": violação clara de boas práticas ou legislação de defesa do consumidor

Se não houver violações, retorne violations: [] e passed: true.`

  try {
    const raw = await generateContent(prompt, systemPrompt)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ComplianceResult
      return parsed
    }
  } catch {
    // Em caso de falha do validador, bloqueia por precaução
  }

  return {
    passed: false,
    violations: ['Validador de compliance falhou — conteúdo bloqueado por precaução'],
    risk_level: 'block',
  }
}

async function validateWithProfessionalRules(
  content: string,
  complianceRules: string,
  profissionalLabel: string
): Promise<ComplianceResult> {
  const systemPrompt = `Você é um auditor especializado em normas de publicidade para ${profissionalLabel} no Brasil. Analise o conteúdo recebido e identifique violações às normas de publicidade profissional. Seja rigoroso. Retorne APENAS JSON válido.`

  const specificViolations = `
Regras específicas do setor a verificar:
- ${complianceRules}

Regras universais adicionais:
${UNIVERSAL_VIOLATIONS}

Verifique também:
- Uso de antes-e-depois de procedimentos ou tratamentos
- Depoimentos que prometem resultados específicos
- Divulgação de especializações não reconhecidas pelos conselhos competentes
`

  const prompt = `Analise este conteúdo para publicidade de ${profissionalLabel}:

"${content}"

${specificViolations}

Retorne JSON com esta estrutura exata:
{
  "passed": true/false,
  "violations": ["descrição da violação 1", "..."],
  "risk_level": "ok" | "warning" | "block"
}

- "ok": sem violações
- "warning": linguagem ambígua, mas não necessariamente ilegal
- "block": violação clara das normas profissionais

Se não houver violações, retorne violations: [] e passed: true.`

  try {
    const raw = await generateContent(prompt, systemPrompt)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ComplianceResult
      return parsed
    }
  } catch {
    // Em caso de falha do validador, bloqueia por precaução
  }

  return {
    passed: false,
    violations: ['Validador de compliance falhou — conteúdo bloqueado por precaução'],
    risk_level: 'block',
  }
}
