// =============================================================================
// DESTAKA — Sanitização de input para prompts de LLM
// Previne prompt injection via campos controlados pelo usuário (nome, categoria, etc.)
// =============================================================================

const MAX_FIELD_LENGTH = 200

/**
 * Sanitiza uma string antes de inserir em prompt de LLM.
 * Remove sequências de instrução comuns, controla comprimento e normaliza espaços.
 */
export function sanitizeForPrompt(input: string | null | undefined, maxLength = MAX_FIELD_LENGTH): string {
  if (!input) return ''

  return input
    .slice(0, maxLength)
    // Remove padrões de injeção de instrução mais comuns
    .replace(/ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi, '')
    .replace(/\bsystem\s*:/gi, '')
    .replace(/\bassistant\s*:/gi, '')
    .replace(/\bhuman\s*:/gi, '')
    // Remove sequências de controle e caracteres zero-width
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
    .trim()
}
