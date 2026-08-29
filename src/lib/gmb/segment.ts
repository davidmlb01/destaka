// =============================================================================
// DESTAKA — Detecção de segmento
// Função única, usada em todos os módulos (posts, optimizer, diagnosis, reviews).
// Fonte canônica — não duplicar em outros arquivos.
// =============================================================================

export type Segment =
  | 'dentista'
  | 'médico'
  | 'psicólogo'
  | 'psiquiatra'
  | 'fisioterapeuta'
  | 'advogado'
  | 'profissional de saúde'

/**
 * Detecta o segmento a partir da categoria do Google Business Profile.
 * Quando specialty está disponível (setup completo), prefira usar specialty diretamente.
 */
export function detectSegment(category: string): Segment {
  const lower = category.toLowerCase()
  if (lower.includes('dentista') || lower.includes('odonto') || lower.includes('periodon') || lower.includes('ortodon') || lower.includes('endodon') || lower.includes('implanto')) return 'dentista'
  if (lower.includes('psiquiatra')) return 'psiquiatra'
  if (lower.includes('psicólogo') || lower.includes('psicologo') || lower.includes('psicologia')) return 'psicólogo'
  if (lower.includes('fisio')) return 'fisioterapeuta'
  if (lower.includes('advogado') || lower.includes('advocacia') || lower.includes('juridico') || lower.includes('jurídico')) return 'advogado'
  if (lower.includes('médico') || lower.includes('medico') || lower.includes('clinica') || lower.includes('clínica') || lower.includes('cirurgi')) return 'médico'
  return 'profissional de saúde'
}
