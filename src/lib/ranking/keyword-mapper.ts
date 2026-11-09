// Motor de Ranking: Camada 1 - Keyword Mapping
// Gera keywords de busca a partir de services[], nome do negocio e bairro.
// Cada keyword representa uma busca real que um cliente faria no Google.

interface KeywordInput {
  orgName: string
  services: string[]
  address: string
  specialty: string | null
}

// Extrai bairro do endereco formatado
function extractNeighborhood(address: string): string {
  const parts = address.split(',')
  if (parts.length >= 2) {
    const beforeCity = parts[parts.length - 2].trim()
    const segments = beforeCity.split('-').map(s => s.trim())
    const bairro = segments[segments.length - 1]
    if (bairro && bairro.length > 2) return bairro
  }
  const cityPart = parts[parts.length - 1]?.trim().split('-')[0].trim()
  return cityPart || ''
}

// Infere especialidades adicionais do nome do negocio
function inferFromName(name: string): string[] {
  const lower = name.toLowerCase()
  const found: string[] = []
  const patterns: Array<[string, string]> = [
    ['quiropraxia', 'quiropraxia'],
    ['quiroprat', 'quiropraxia'],
    ['osteopatia', 'osteopatia'],
    ['fisioterapia', 'fisioterapia'],
    ['pilates', 'pilates'],
    ['acupuntura', 'acupuntura'],
    ['rpg', 'RPG'],
    ['reabilitacao', 'reabilitacao'],
    ['reabilitação', 'reabilitacao'],
  ]
  for (const [pattern, keyword] of patterns) {
    if (lower.includes(pattern) && !found.includes(keyword)) {
      found.push(keyword)
    }
  }
  return found
}

// Normaliza servico para keyword de busca
function normalizeService(service: string): string {
  return service
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Gera lista de keywords de ranking para uma organizacao.
 * Cada keyword = "servico + bairro" (como o usuario buscaria no Google).
 * Retorna keywords ordenadas por prioridade (servico principal primeiro).
 */
export function generateKeywords(input: KeywordInput): Array<{ keyword: string; isPrimary: boolean }> {
  const neighborhood = extractNeighborhood(input.address)
  if (!neighborhood) return []

  const allServices = new Set<string>()

  // 1. Services do onboarding (fonte principal)
  for (const s of input.services) {
    allServices.add(normalizeService(s))
  }

  // 2. Inferidos do nome do negocio
  for (const s of inferFromName(input.orgName)) {
    allServices.add(normalizeService(s))
  }

  // 3. Specialty como fallback
  if (input.specialty && allServices.size === 0) {
    allServices.add(normalizeService(input.specialty))
  }

  if (allServices.size === 0) return []

  // Gerar keywords: "servico + bairro"
  // Primary é definido pelo nome do negócio (keyword mais relevante)
  const keywords: Array<{ keyword: string; isPrimary: boolean }> = []
  const businessNameLower = (input.orgName ?? '').toLowerCase()

  for (const service of allServices) {
    const kw = `${service} ${neighborhood}`
    // Primary: keyword cujo serviço aparece no nome do negócio (mais relevante)
    const isPrimary = businessNameLower.includes(service.toLowerCase())
    keywords.push({ keyword: kw, isPrimary })
  }

  // Se nenhuma keyword matchou o nome do negócio, a primeira fica como primary
  if (keywords.length > 0 && !keywords.some(k => k.isPrimary)) {
    keywords[0].isPrimary = true
  }
  // Se mais de uma matchou, manter só a primeira como primary
  let foundPrimary = false
  for (const kw of keywords) {
    if (kw.isPrimary) {
      if (foundPrimary) kw.isPrimary = false
      foundPrimary = true
    }
  }

  return keywords
}
