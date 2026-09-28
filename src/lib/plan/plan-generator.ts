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
    title: 'Otimizar categorias do perfil',
    description: 'Adicionar categorias que seus concorrentes usam e voce nao tem.',
    mode: 'auto' as StepMode,
    impact: 5,
    component: 'gmb_completude',
    action_type: 'update_categories',
    week: 1,
    condition: (ctx: ScoreContext) => ctx.categoryCount < 3,
  },
  {
    id: 'description',
    title: 'Reescrever descricao com keywords',
    description: 'Descricao otimizada com termos que pacientes usam ao buscar na sua regiao.',
    mode: 'auto' as StepMode,
    impact: 6,
    component: 'gmb_completude',
    action_type: 'update_description',
    week: 1,
    condition: (ctx: ScoreContext) => !ctx.hasDescription,
  },
  {
    id: 'services',
    title: 'Listar servicos com descricao',
    description: 'Servicos aparecem como filtro na busca do Google Maps.',
    mode: 'auto' as StepMode,
    impact: 5,
    component: 'gmb_completude',
    action_type: 'add_services',
    week: 1,
    condition: () => true, // sempre incluir, optimizer verifica internamente
  },
  {
    id: 'hours',
    title: 'Definir horario de funcionamento',
    description: 'Perfis sem horario perdem posicoes na busca local.',
    mode: 'auto' as StepMode,
    impact: 3,
    component: 'gmb_completude',
    action_type: 'update_hours',
    week: 2,
    condition: (ctx: ScoreContext) => !ctx.hasHours,
  },
  {
    id: 'attributes',
    title: 'Adicionar atributos do estabelecimento',
    description: 'Wi-Fi, estacionamento, acessibilidade, formas de pagamento.',
    mode: 'auto' as StepMode,
    impact: 4,
    component: 'gmb_completude',
    action_type: 'update_attributes',
    week: 2,
    condition: (ctx: ScoreContext) => ctx.attributeCount < 5,
  },
  {
    id: 'posts',
    title: 'Ativar posts semanais automaticos',
    description: 'O Destaka publica conteudo toda semana no seu perfil.',
    mode: 'auto' as StepMode,
    impact: 2,
    component: 'gmb_completude',
    action_type: null,
    week: 2,
    condition: (ctx: ScoreContext) => ctx.recentPostCount < 2,
  },
  {
    id: 'photos',
    title: 'Adicionar fotos do consultorio',
    description: 'Fotos do espaco, equipe e procedimentos. Seus concorrentes tem mais fotos que voce.',
    mode: 'manual' as StepMode,
    impact: 5,
    component: 'gmb_completude',
    action_type: null,
    week: 3,
    condition: (ctx: ScoreContext) => ctx.photoCount < 10,
  },
  {
    id: 'review-responses',
    title: 'Responder todas as avaliacoes',
    description: 'O Destaka responde automaticamente. Taxa ideal: 80%+.',
    mode: 'auto' as StepMode,
    impact: 5,
    component: 'reputacao',
    action_type: null,
    week: 3,
    condition: (ctx: ScoreContext) => ctx.reviewResponseRate < 0.8,
  },
  {
    id: 'request-reviews',
    title: 'Pedir avaliacoes aos pacientes',
    description: 'Envie o link de avaliacao apos cada consulta. Meta: 2+ reviews por mes.',
    mode: 'manual' as StepMode,
    impact: 8,
    component: 'reputacao',
    action_type: null,
    week: 4,
    condition: (ctx: ScoreContext) => ctx.reviewCount < 50,
  },
  {
    id: 'website',
    title: 'Vincular website ao perfil',
    description: 'Perfis com site recebem mais cliques e transmitem mais credibilidade.',
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
        description = `Adicione fotos do consultorio, equipe e procedimentos. Seus concorrentes tem em media ${Math.round(competitorCtx.avgPhotoCount)} fotos.`
      }
      if (action.id === 'request-reviews' && competitorCtx.avgReviewCount > 0) {
        description = `Envie o link de avaliacao apos cada consulta. Seus concorrentes tem em media ${Math.round(competitorCtx.avgReviewCount)} avaliacoes.`
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

  await db.from('surpass_plans').insert({
    organization_id: organizationId,
    ...plan,
  })
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
