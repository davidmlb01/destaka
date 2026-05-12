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

export interface DayBrief {
  date: string
  blogPost: {
    keyword: string
    secondaryKeywords: string[]
    schema: 'article' | 'faq' | 'howto'
    suggestedTitle: string
    targetWordCount: number
    tier: 1 | 2 | 3
  }
  linkedin: {
    angle: string
    hook: string
  }
  instagram: {
    type: 'carrossel' | 'estatico'
    angle: string
    slides?: number
  }
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
