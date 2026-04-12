export type Specialty =
  | 'dentista'
  | 'medico'
  | 'fisioterapeuta'
  | 'psicologo'
  | 'nutricionista'
  | 'outro'

export type ToneCommunication = 'formal' | 'proximo' | 'tecnico'
export type AutomationPreference = 'manual' | 'automatico'
export type ScoreFaixa = 'fraca' | 'funcional' | 'forte' | 'perfeita'
export type Tendencia = 'melhorando' | 'estavel' | 'declinando'

export interface ScoreDestaka {
  total: number
  gmb_completude: number
  reputacao: number
  visibilidade: number
  retencao: number
  conversao: number
  faixa: ScoreFaixa
  tendencia: Tendencia
}

export interface Organization {
  id: string
  name: string
  specialty: Specialty
  tone: ToneCommunication
  automation_preference: AutomationPreference
  service_areas: string[]
  gbp_location_id: string | null
  created_at: string
  updated_at: string
}

export interface Professional {
  id: string
  user_id: string
  organization_id: string
  email: string
  name: string
  role: 'owner' | 'admin'
  created_at: string
}

export interface GbpProfile {
  id: string
  organization_id: string
  location_id: string
  name: string | null
  categories: string[]
  attributes: Record<string, unknown>
  services: unknown[]
  description: string | null
  phone: string | null
  address: Record<string, unknown> | null
  hours: Record<string, unknown> | null
  photo_count: number
  last_synced_at: string | null
}

export interface Review {
  id: string
  organization_id: string
  review_id: string
  author_name: string | null
  rating: number
  comment: string | null
  published_at: string | null
  response_text: string | null
  response_published_at: string | null
  created_at: string
}

export interface Post {
  id: string
  organization_id: string
  content: string
  post_type: 'educativo' | 'procedimento' | 'bairro' | 'review_highlight' | 'equipe'
  status: 'pending' | 'approved' | 'published' | 'rejected'
  scheduled_at: string | null
  published_at: string | null
  gbp_post_id: string | null
  photo_suggestion: string | null
  created_at: string
}

export interface ScoreSnapshot {
  id: string
  organization_id: string
  total: number
  gmb_completude: number
  reputacao: number
  visibilidade: number
  retencao: number
  conversao: number
  faixa: ScoreFaixa
  tendencia: Tendencia
  snapshot_date: string
  created_at: string
}

export interface MonthlyReport {
  id: string
  organization_id: string
  month: number
  year: number
  data: ReportData
  sent_at: string | null
  email_status: string | null
  created_at: string
}

export interface ReportData {
  visibilidade: {
    profile_views: number
    contacts_generated: number
    maps_position_estimate: number | null
  }
  reputacao: {
    new_reviews: number
    avg_rating: number
    response_rate: number
  }
  score: {
    previous: number
    current: number
    faixa: ScoreFaixa
  }
  foco_proximo_mes: string
}
