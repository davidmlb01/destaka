// =============================================================================
// DESTAKA — Surpass Plan Generator
// Gera plano semanal para superar concorrentes baseado no score breakdown
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepStatus = 'pending' | 'active' | 'done' | 'skipped'
export type StepMode = 'auto' | 'manual'

export interface PlanStep {
  id: string
  week: number
  title: string
  description: string
  mode: StepMode
  impact: number
  score_component: string
  status: StepStatus
  completed_at: string | null
  action_type: string | null
}

export interface SurpassPlan {
  id: string
  organization_id: string
  current_score: number
  competitor_max_score: number | null
  target_score: number
  steps: PlanStep[]
  status: 'active' | 'completed' | 'expired'
  created_at: string
  updated_at: string
  expires_at: string
}

// ---------------------------------------------------------------------------
// Plan generation
// ---------------------------------------------------------------------------

interface ScoreContext {
  hasDescription: boolean
  categoryCount: number
  attributeCount: number
  photoCount: number
  hasHours: boolean
  recentPostCount: number
  reviewCount: number
  avgRating: number
  reviewResponseRate: number
  hasWebsite: boolean
  totalScore: number
}

interface CompetitorContext {
  maxScore: number
  avgPhotoCount: number
  avgReviewCount: number
}

// Matriz de acoes possiveis, ordenadas por prioridade
const ACTION_MATRIX = [
  {
    id: 'categories',
    title: 'Ajustar suas categorias no Google',
    description: 'Seus concorrentes aparecem em buscas que você ainda não aparece. Vamos corrigir isso.',
    mode: 'auto' as StepMode,
    impact: 5,
    component: 'gmb_completude',
    action_type: 'update_categories',
    week: 1,
    condition: (ctx: ScoreContext) => ctx.categoryCount < 3,
  },
  {
    id: 'description',
    title: 'Melhorar sua descrição no Google',
    description: 'Vamos incluir os termos que pacientes realmente usam quando procuram por você.',
    mode: 'auto' as StepMode,
    impact: 6,
    component: 'gmb_completude',
    action_type: 'update_description',
    week: 1,
    condition: (ctx: ScoreContext) => !ctx.hasDescription,
  },
  {
    id: 'services',
    title: 'Colocar seus serviços no perfil',
    description: 'No Google Maps, pacientes filtram por serviço. Sem lista, você fica invisível.',
    mode: 'auto' as StepMode,
    impact: 5,
    component: 'gmb_completude',
    action_type: 'add_services',
    week: 1,
    condition: () => true, // sempre incluir, optimizer verifica internamente
  },
  {
    id: 'hours',
    title: 'Configurar seu horário de atendimento',
    description: 'O Google rebaixa perfis sem horário. Vamos resolver em segundos.',
    mode: 'auto' as StepMode,
    impact: 3,
    component: 'gmb_completude',
    action_type: 'update_hours',
    week: 2,
    condition: (ctx: ScoreContext) => !ctx.hasHours,
  },
  {
    id: 'attributes',
    title: 'Completar informações do consultório',
    description: 'Wi-Fi, estacionamento, acessibilidade. Cada detalhe conta para o Google te recomendar.',
    mode: 'auto' as StepMode,
    impact: 4,
    component: 'gmb_completude',
    action_type: 'update_attributes',
    week: 2,
    condition: (ctx: ScoreContext) => ctx.attributeCount < 5,
  },
  {
    id: 'posts',
    title: 'Ativar publicações semanais',
    description: 'O Destaka publica no seu perfil toda semana, sem você precisar fazer nada.',
    mode: 'auto' as StepMode,
    impact: 2,
    component: 'gmb_completude',
    action_type: null,
    week: 2,
    condition: (ctx: ScoreContext) => ctx.recentPostCount < 2,
  },
  {
    id: 'photos',
    title: 'Adicionar fotos do seu espaço',
    description: 'Pacientes confiam mais em perfis com fotos reais. Seus concorrentes têm mais fotos que você.',
    mode: 'manual' as StepMode,
    impact: 5,
    component: 'gmb_completude',
    action_type: null,
    week: 3,
    condition: (ctx: ScoreContext) => ctx.photoCount < 10,
  },
  {
    id: 'review-responses',
    title: 'Responder suas avaliações',
    description: 'O Destaka já responde por você. Profissionais que respondem recebem mais pacientes.',
    mode: 'auto' as StepMode,
    impact: 5,
    component: 'reputacao',
    action_type: null,
    week: 3,
    condition: (ctx: ScoreContext) => ctx.reviewResponseRate < 0.8,
  },
  {
    id: 'request-reviews',
    title: 'Conseguir mais avaliações',
    description: 'Peça uma avaliação ao final de cada consulta. Dois por mês já faz diferença.',
    mode: 'manual' as StepMode,
    impact: 8,
    component: 'reputacao',
    action_type: null,
    week: 4,
    condition: (ctx: ScoreContext) => ctx.reviewCount < 50,
  },
  {
    id: 'website',
    title: 'Vincular seu site ao perfil',
    description: 'Perfis com site recebem mais cliques e passam mais confiança.',
    mode: 'manual' as StepMode,
    impact: 3,
    component: 'gmb_completude',
    action_type: null,
    week: 5,
    condition: (ctx: ScoreContext) => !ctx.hasWebsite,
  },
]

export function generatePlan(
  scoreCtx: ScoreContext,
  competitorCtx: CompetitorContext | null
): Omit<SurpassPlan, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'expires_at'> {
  const steps: PlanStep[] = []

  // Filtrar acoes aplicaveis
  const applicableActions = ACTION_MATRIX.filter(a => a.condition(scoreCtx))

  // Enriquecer descricoes com contexto competitivo
  for (const action of applicableActions) {
    let description = action.description
    if (competitorCtx) {
      if (action.id === 'photos' && competitorCtx.avgPhotoCount > 0) {
        description = `Adicione fotos do seu espaço e equipe. Seus concorrentes têm em média ${Math.round(competitorCtx.avgPhotoCount)} fotos.`
      }
      if (action.id === 'request-reviews' && competitorCtx.avgReviewCount > 0) {
        description = `Peça uma avaliação ao final de cada consulta. Seus concorrentes têm em média ${Math.round(competitorCtx.avgReviewCount)} avaliações.`
      }
    }

    steps.push({
      id: `week-${action.week}-${action.id}`,
      week: action.week,
      title: action.title,
      description,
      mode: action.mode,
      impact: action.impact,
      score_component: action.component,
      status: 'pending',
      completed_at: null,
      action_type: action.action_type,
    })
  }

  // Primeiro step pendente vira 'active'
  if (steps.length > 0) {
    steps[0].status = 'active'
  }

  // Calcular target
  const totalImpact = steps.reduce((sum, s) => sum + s.impact, 0)
  const competitorMax = competitorCtx?.maxScore ?? 100
  const target = Math.min(100, Math.max(
    scoreCtx.totalScore + totalImpact,
    competitorMax
  ))

  return {
    current_score: scoreCtx.totalScore,
    competitor_max_score: competitorCtx?.maxScore ?? null,
    target_score: Math.min(100, target),
    steps,
    status: 'active',
  }
}

// ---------------------------------------------------------------------------
// Progress update (chamado pelo score-calculator cron)
// ---------------------------------------------------------------------------

export function updatePlanProgress(
  plan: SurpassPlan,
  currentCtx: ScoreContext
): { updated: boolean; plan: SurpassPlan } {
  let updated = false
  const steps = [...plan.steps.map(s => ({ ...s }))]

  for (const step of steps) {
    if (step.status === 'done' || step.status === 'skipped') continue

    let completed = false

    switch (step.id) {
      case 'week-1-categories':
        completed = currentCtx.categoryCount >= 3
        break
      case 'week-1-description':
        completed = currentCtx.hasDescription
        break
      case 'week-1-services':
        // Verificado pelo optimizer
        completed = false
        break
      case 'week-2-hours':
        completed = currentCtx.hasHours
        break
      case 'week-2-attributes':
        completed = currentCtx.attributeCount >= 5
        break
      case 'week-2-posts':
        completed = currentCtx.recentPostCount >= 2
        break
      case 'week-3-photos':
        completed = currentCtx.photoCount >= 10
        break
      case 'week-3-review-responses':
        completed = currentCtx.reviewResponseRate >= 0.8
        break
      case 'week-4-request-reviews':
        completed = currentCtx.reviewCount >= 20
        break
      case 'week-5-website':
        completed = currentCtx.hasWebsite
        break
    }

    if (completed) {
      step.status = 'done'
      step.completed_at = new Date().toISOString()
      updated = true
    }
  }

  // Avancar proximo step pendente para active
  const hasActive = steps.some(s => s.status === 'active')
  if (!hasActive) {
    const nextPending = steps.find(s => s.status === 'pending')
    if (nextPending) {
      nextPending.status = 'active'
      updated = true
    }
  }

  // Verificar se plano esta completo
  const allDone = steps.every(s => s.status === 'done' || s.status === 'skipped')
  const planStatus = allDone ? 'completed' as const : plan.status

  return {
    updated: updated || planStatus !== plan.status,
    plan: { ...plan, steps, status: planStatus, updated_at: new Date().toISOString() },
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function getActivePlan(
  db: SupabaseClient,
  organizationId: string
): Promise<SurpassPlan | null> {
  const { data } = await db
    .from('surpass_plans')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  // Verificar expiracao
  if (new Date(data.expires_at) < new Date()) {
    await db
      .from('surpass_plans')
      .update({ status: 'expired' })
      .eq('id', data.id)
    return null
  }

  return data as SurpassPlan
}

export async function savePlan(
  db: SupabaseClient,
  organizationId: string,
  plan: Omit<SurpassPlan, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'expires_at'>
): Promise<void> {
  // Expirar planos anteriores
  await db
    .from('surpass_plans')
    .update({ status: 'expired' })
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const { error } = await db.from('surpass_plans').insert({
    organization_id: organizationId,
    ...plan,
  })

  if (error) {
    console.error('[plan-generator] insert error:', error.message, error.code)
    throw new Error(`Falha ao salvar plano: ${error.message}`)
  }
}

export async function updatePlanInDb(
  db: SupabaseClient,
  plan: SurpassPlan
): Promise<void> {
  await db
    .from('surpass_plans')
    .update({
      steps: plan.steps,
      status: plan.status,
      updated_at: plan.updated_at,
    })
    .eq('id', plan.id)
}
