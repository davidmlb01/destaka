// =============================================================================
// DESTAKA — Score Calculator
// Algoritmo conforme docs/architecture/gmm-architecture.md seção 7
// =============================================================================

export interface GmbProfileData {
  // Informações básicas
  hasName: boolean
  hasPhone: boolean
  hasAddress: boolean
  hasHours: boolean
  hasWebsite: boolean
  hasCategory: boolean
  // Fotos
  hasLogoPhoto: boolean
  spacePhotosCount: number   // fotos do espaço/interior
  totalPhotosCount: number
  hasCoverPhoto: boolean
  // Avaliações
  reviewsCount: number
  reviewsAvgRating: number
  reviewsRepliedCount: number
  // Posts
  lastPostDaysAgo: number | null  // null = nunca postou
  // Serviços
  servicesCount: number
  servicesWithDescCount: number
  // Atributos
  attributesCount: number
  // Metadata
  category: string
  locationName: string
}

export interface CategoryScore {
  name: string
  label: string
  score: number
  maxScore: number
  percentage: number
  issues: ScoreIssue[]
}

export interface ScoreIssue {
  field: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  impact: number
}

export interface ScoreResult {
  total: number
  categories: {
    info: CategoryScore
    photos: CategoryScore
    reviews: CategoryScore
    posts: CategoryScore
    services: CategoryScore
    attributes: CategoryScore
  }
}

export function calculateScore(profile: GmbProfileData): ScoreResult {
  const info = scoreInfo(profile)
  const photos = scorePhotos(profile)
  const reviews = scoreReviews(profile)
  const posts = scorePosts(profile)
  const services = scoreServices(profile)
  const attributes = scoreAttributes(profile)

  const total = info.score + photos.score + reviews.score + posts.score + services.score + attributes.score

  return { total, categories: { info, photos, reviews, posts, services, attributes } }
}

function scoreInfo(p: GmbProfileData): CategoryScore {
  const issues: ScoreIssue[] = []
  let score = 0

  if (p.hasName) score += 5
  else issues.push({ field: 'name', severity: 'critical', message: 'Nome do negócio não preenchido', impact: 5 })

  if (p.hasPhone) score += 5
  else issues.push({ field: 'phone', severity: 'critical', message: 'Telefone não cadastrado — pacientes não conseguem ligar', impact: 5 })

  if (p.hasAddress) score += 5
  else issues.push({ field: 'address', severity: 'critical', message: 'Endereço não configurado — não aparece no Maps', impact: 5 })

  if (p.hasHours) score += 5
  else issues.push({ field: 'hours', severity: 'warning', message: 'Horário de funcionamento não definido', impact: 5 })

  if (p.hasWebsite) score += 3
  else issues.push({ field: 'website', severity: 'info', message: 'Website não vinculado', impact: 3 })

  if (p.hasCategory) score += 2
  else issues.push({ field: 'category', severity: 'warning', message: 'Categoria principal não definida', impact: 2 })

  return makeCategory('info', 'Informações Básicas', score, 25, issues)
}

function scorePhotos(p: GmbProfileData): CategoryScore {
  const issues: ScoreIssue[] = []
  let score = 0

  if (p.hasLogoPhoto) score += 5
  else issues.push({ field: 'logo', severity: 'warning', message: 'Sem foto de logotipo — passa menos credibilidade', impact: 5 })

  if (p.spacePhotosCount >= 3) score += 5
  else issues.push({ field: 'space_photos', severity: 'warning', message: `Só ${p.spacePhotosCount} foto(s) do espaço — ideal: 3+`, impact: 5 })

  if (p.totalPhotosCount >= 5) score += 5
  else issues.push({ field: 'total_photos', severity: 'warning', message: `Apenas ${p.totalPhotosCount} foto(s) no total — ideal: 5+`, impact: 5 })

  if (p.hasCoverPhoto) score += 5
  else issues.push({ field: 'cover', severity: 'info', message: 'Sem foto de capa personalizada', impact: 5 })

  return makeCategory('photos', 'Fotos', score, 20, issues)
}

function scoreReviews(p: GmbProfileData): CategoryScore {
  const issues: ScoreIssue[] = []
  let score = 0

  if (p.reviewsCount >= 10) score += 10
  else issues.push({ field: 'reviews_count', severity: 'critical', message: `Apenas ${p.reviewsCount} avaliação(ões) — ideal: 10+`, impact: 10 })

  if (p.reviewsAvgRating >= 4.0) score += 10
  else issues.push({ field: 'rating', severity: 'critical', message: `Nota média ${p.reviewsAvgRating.toFixed(1)} — meta: 4.0+`, impact: 10 })

  const replyRate = p.reviewsCount > 0 ? p.reviewsRepliedCount / p.reviewsCount : 0
  if (replyRate >= 0.8) score += 5
  else issues.push({ field: 'reply_rate', severity: 'warning', message: `Só ${Math.round(replyRate * 100)}% das avaliações respondidas — ideal: 80%+`, impact: 5 })

  return makeCategory('reviews', 'Avaliações', score, 25, issues)
}

function scorePosts(p: GmbProfileData): CategoryScore {
  const issues: ScoreIssue[] = []
  let score = 0

  if (p.lastPostDaysAgo !== null && p.lastPostDaysAgo <= 7) {
    score += 10
  } else if (p.lastPostDaysAgo !== null && p.lastPostDaysAgo <= 30) {
    score += 5
    issues.push({ field: 'post_recency', severity: 'info', message: 'Último post há mais de 7 dias — poste toda semana', impact: 5 })
  } else {
    issues.push({ field: 'posts', severity: 'critical', message: p.lastPostDaysAgo === null ? 'Nunca publicou um post' : `Último post há ${p.lastPostDaysAgo} dias`, impact: 15 })
  }

  return makeCategory('posts', 'Posts', score, 15, issues)
}

function scoreServices(p: GmbProfileData): CategoryScore {
  const issues: ScoreIssue[] = []
  let score = 0

  if (p.servicesCount >= 3) score += 5
  else issues.push({ field: 'services_count', severity: 'warning', message: `Apenas ${p.servicesCount} serviço(s) listado(s) — ideal: 3+`, impact: 5 })

  if (p.servicesWithDescCount >= p.servicesCount && p.servicesCount > 0) score += 5
  else issues.push({ field: 'services_desc', severity: 'info', message: 'Serviços sem descrição detalhada', impact: 5 })

  return makeCategory('services', 'Serviços', score, 10, issues)
}

function scoreAttributes(p: GmbProfileData): CategoryScore {
  const issues: ScoreIssue[] = []
  let score = 0

  if (p.attributesCount >= 5) score += 5
  else issues.push({ field: 'attributes', severity: 'info', message: `Apenas ${p.attributesCount} atributo(s) — ideal: 5+ (ex: Wi-Fi, estacionamento, acessível)`, impact: 5 })

  return makeCategory('attributes', 'Atributos', score, 5, issues)
}

function makeCategory(
  name: string,
  label: string,
  score: number,
  maxScore: number,
  issues: ScoreIssue[]
): CategoryScore {
  return { name, label, score, maxScore, percentage: Math.round((score / maxScore) * 100), issues }
}
