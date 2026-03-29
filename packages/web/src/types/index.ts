// =============================================================================
// DESTAKA — Tipos globais
// =============================================================================

export type Plan = 'free' | 'essencial' | 'pro' | 'agencia'

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  plan: Plan
  stripe_customer_id: string | null
  created_at: string
}

export interface GmbProfile {
  id: string
  user_id: string
  google_location_id: string
  name: string
  address: string
  phone: string | null
  website: string | null
  category: string | null
  score: number | null
  last_synced_at: string | null
  created_at: string
}

export interface Diagnostic {
  id: string
  profile_id: string
  score_total: number
  score_info_basica: number
  score_fotos: number
  score_avaliacoes: number
  score_posts: number
  score_servicos: number
  score_atributos: number
  issues: DiagnosticIssue[]
  created_at: string
}

export interface DiagnosticIssue {
  category: string
  field: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  action: string
}

export interface OptimizationAction {
  id: string
  profile_id: string
  diagnostic_id: string
  type: string
  status: 'pending' | 'in_progress' | 'done' | 'failed'
  payload: Record<string, unknown>
  executed_at: string | null
  created_at: string
}

export interface GmbPost {
  id: string
  profile_id: string
  google_post_id: string | null
  content: string
  type: 'update' | 'event' | 'offer'
  status: 'draft' | 'published' | 'scheduled' | 'failed'
  scheduled_for: string | null
  published_at: string | null
  created_at: string
}

export interface GmbReview {
  id: string
  profile_id: string
  google_review_id: string
  author: string
  rating: number
  text: string | null
  reply: string | null
  reply_status: 'pending' | 'replied' | 'ignored'
  review_date: string
  created_at: string
}

export interface GmbMetric {
  id: string
  profile_id: string
  date: string
  views_search: number
  views_maps: number
  clicks_website: number
  clicks_call: number
  clicks_directions: number
}
