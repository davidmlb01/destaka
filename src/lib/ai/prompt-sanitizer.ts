// Prompt Sanitizer — LGPD Art. 11 (CORREÇÃO B)
// Dados de saúde são dados sensíveis pela LGPD. Antes de qualquer texto de paciente
// entrar num prompt, remove identificadores pessoais para minimizar risco de exposição
// de dados sensíveis no contexto do modelo de linguagem.
//
// Cobertura do termo de onboarding (verificar em onboarding/terms):
// - Dados de avaliações usados para geração automatizada de respostas
// - Armazenamento de tom para calibração personalizada
// - Direito de exclusão: cliente pode solicitar purga dos dados via dashboard

const CPF_PATTERN = /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}\b/g
const PHONE_PATTERN = /\(?\d{2}\)?\s?\d{4,5}[-.\s]?\d{4}/g
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// Nomes próprios seguidos de padrões de identificação de paciente
// Captura padrões do tipo "Dra. Maria", "Dr. João Silva", "paciente Ana"
const PATIENT_NAME_PATTERN = /(?:paciente|sr\.?|sra\.?|dra?\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g

const MAX_REVIEW_LENGTH = 500

/**
 * Sanitiza texto de avaliação de paciente antes de enviar ao LLM.
 * Remove CPF, telefone, email e nomes próprios identificados.
 * Trunca para MAX_REVIEW_LENGTH para evitar exfiltração de contexto extenso.
 */
export function sanitizePatientData(reviewComment: string): string {
  if (!reviewComment) return ''

  let sanitized = reviewComment
    .replace(CPF_PATTERN, '[dado removido]')
    .replace(PHONE_PATTERN, '[dado removido]')
    .replace(EMAIL_PATTERN, '[dado removido]')
    .replace(PATIENT_NAME_PATTERN, '[paciente]')

  if (sanitized.length > MAX_REVIEW_LENGTH) {
    sanitized = sanitized.slice(0, MAX_REVIEW_LENGTH) + '...'
  }

  return sanitized.trim()
}

/**
 * Verifica se a organização possui consentimento LGPD registrado para uso de dados em IA.
 * Deve ser chamada antes de processar qualquer dado de paciente em prompts.
 */
export function hasLgpdConsentForAi(org: {
  lgpd_ai_consent?: boolean
  lgpd_consent_date?: string
}): boolean {
  return org.lgpd_ai_consent === true && !!org.lgpd_consent_date
}
