// Compliance Validator — Segunda passagem independente (CORREÇÃO A)
// Valida conteúdo gerado contra normas CFM/CRO/COFFITO via chamada separada ao Claude.
// O modelo não consegue validar seu próprio output de forma confiável — por isso uma
// chamada independente é necessária como guardrail real.

import { generateContent } from './client'

export interface ComplianceResult {
  passed: boolean
  violations: string[]
  risk_level: 'ok' | 'warning' | 'block'
}

const VALIDATOR_SYSTEM = `Você é um auditor especializado em normas CFM (Conselho Federal de Medicina), CRO (Conselho Regional de Odontologia) e COFFITO para publicidade de profissionais de saúde no Brasil. Analise o conteúdo recebido e identifique violações às normas de publicidade médica. Seja rigoroso. Retorne APENAS JSON válido.`

const VIOLATIONS_CHECKLIST = `
Verifique se o conteúdo viola qualquer uma destas regras:
1. Menciona preços, valores, descontos ou promoções
2. Promete resultados clínicos específicos ("você vai curar", "elimina a dor", "garantido")
3. Usa linguagem sensacionalista ("o melhor", "revolucionário", "milagre", "incrível")
4. Compara com outros profissionais ou clínicas de forma depreciativa
5. Usa superlativos proibidos ("o único", "o mais barato", "o mais moderno")
6. Menciona antes-e-depois de procedimentos clínicos
7. Divulga especializações não reconhecidas pelos conselhos
8. Usa depoimentos que prometem resultados específicos
`

export async function validateCompliance(content: string): Promise<ComplianceResult> {
  const prompt = `Analise este conteúdo para publicidade de profissional de saúde:

"${content}"

${VIOLATIONS_CHECKLIST}

Retorne JSON com esta estrutura exata:
{
  "passed": true/false,
  "violations": ["descrição da violação 1", "..."],
  "risk_level": "ok" | "warning" | "block"
}

- "ok": sem violações
- "warning": linguagem ambígua, mas não necessariamente ilegal
- "block": violação clara das normas CFM/CRO/COFFITO

Se não houver violações, retorne violations: [] e passed: true.`

  try {
    const raw = await generateContent(prompt, VALIDATOR_SYSTEM)
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
