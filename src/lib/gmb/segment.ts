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
  | 'veterinário'
  | 'contador'
  | 'imobiliária'
  | 'beleza'
  | 'fitness'
  | 'restaurante'
  | 'automotivo'
  | 'educação'
  | 'tecnologia'
  | 'profissional de saúde'
  | 'negócio local'

/**
 * Detecta o segmento a partir da categoria do Google Business Profile.
 * Quando specialty está disponível (setup completo), prefira usar specialty diretamente.
 */
export function detectSegment(category: string): Segment {
  const lower = category.toLowerCase()

  // Saúde
  if (lower.includes('dentista') || lower.includes('odonto') || lower.includes('periodon') || lower.includes('ortodon') || lower.includes('endodon') || lower.includes('implanto')) return 'dentista'
  if (lower.includes('psiquiatra')) return 'psiquiatra'
  if (lower.includes('psicólogo') || lower.includes('psicologo') || lower.includes('psicologia')) return 'psicólogo'
  if (lower.includes('fisio')) return 'fisioterapeuta'

  // Jurídico
  if (lower.includes('advogado') || lower.includes('advocacia') || lower.includes('juridico') || lower.includes('jurídico')) return 'advogado'

  // Veterinário / Pet
  if (lower.includes('veterinár') || lower.includes('veterinar') || lower.includes('pet shop') || lower.includes('banho e tosa') || lower.includes('pet ')) return 'veterinário'

  // Contabilidade
  if (lower.includes('contador') || lower.includes('contabil') || lower.includes('contábil')) return 'contador'

  // Imobiliário
  if (lower.includes('imobiliár') || lower.includes('imobiliar') || lower.includes('corretor de imóve') || lower.includes('corretor de imove')) return 'imobiliária'

  // Beleza
  if (lower.includes('salão') || lower.includes('salao') || lower.includes('barbearia') || lower.includes('estética') || lower.includes('estetica') || lower.includes('cabeleirei') || lower.includes('manicure')) return 'beleza'

  // Fitness
  if (lower.includes('academia') || lower.includes('personal trainer') || lower.includes('crossfit') || lower.includes('pilates') || lower.includes('musculação') || lower.includes('musculacao')) return 'fitness'

  // Restaurante / Alimentação
  if (lower.includes('restaurante') || lower.includes('lanchonete') || lower.includes('padaria') || lower.includes('cafeteria') || lower.includes('pizzaria') || lower.includes('hamburgueria') || lower.includes('bar ') || lower.includes('sorveteria')) return 'restaurante'

  // Automotivo
  if (lower.includes('oficina') || lower.includes('mecânic') || lower.includes('mecanica') || lower.includes('auto center') || lower.includes('funilaria') || lower.includes('borracharia') || lower.includes('autoelétrica') || lower.includes('autoeletrica')) return 'automotivo'

  // Educação
  if (lower.includes('escola') || lower.includes('curso') || lower.includes('faculdade') || lower.includes('professor') || lower.includes('educaç') || lower.includes('educac')) return 'educação'

  // Tecnologia
  if (lower.includes('software') || lower.includes('agência digital') || lower.includes('agencia digital') || lower.includes('consultoria de ti') || lower.includes('desenvolvimento') || lower.includes('tecnologia')) return 'tecnologia'

  // Saúde genérica (médico por último para não pegar clínicas de outras áreas)
  if (lower.includes('médico') || lower.includes('medico') || lower.includes('clinica') || lower.includes('clínica') || lower.includes('cirurgi')) return 'médico'

  // Fallback genérico
  return 'negócio local'
}
