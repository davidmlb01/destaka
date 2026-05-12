// =============================================================================
// DESTAKA Content Pipeline — Tipos compartilhados
// =============================================================================

export interface KeywordResult {
  keyword: string
  volume: 'alto' | 'medio' | 'baixo'
  intent: 'informacional' | 'transacional' | 'navegacional'
  pain: string
  funnelStage: 'topo' | 'meio' | 'fundo'
  score: number
}

export interface BlogPostBrief {
  keyword: string
  secondaryKeywords: string[]
  schema: 'article' | 'faq' | 'howto'
  suggestedTitle: string
  targetWordCount: number
  tier: 1 | 2 | 3
}

export interface LinkedInBrief {
  angle: string
  hook: string
}

export interface InstagramBrief {
  type: 'carrossel' | 'reel'
  angle: string
  slides?: number
}

export interface DayBrief {
  date: string
  blogPosts: BlogPostBrief[]
  linkedinPosts: LinkedInBrief[]
  instagram: InstagramBrief | null
}

/**
 * Compat: mantém acesso legado para o writer (1 blogPost + 1 linkedin por vez).
 * O orchestrator monta este objeto ao iterar os arrays de DayBrief.
 */
export interface SingleBrief {
  date: string
  blogPost: BlogPostBrief
  linkedin: LinkedInBrief
  instagram: InstagramBrief | null
}

export interface EditorialCalendar {
  period: { start: string; end: string }
  days: DayBrief[]
}

export interface PipelineReport {
  startedAt: string
  completedAt: string
  calendar: EditorialCalendar
  articlesGenerated: number
  linkedinPostsGenerated: number
  instagramPostsGenerated: number
  files: string[]
  errors: string[]
}
