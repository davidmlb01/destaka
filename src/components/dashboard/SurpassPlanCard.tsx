'use client'

import { useSurpassPlan } from './hooks/useSurpassPlan'
import { Spinner } from '@/components/ui/Spinner'

const MODE_BADGE = {
  auto: { label: 'Automatico', color: '#38BDF8', bg: 'rgba(56,189,248,0.1)' },
  manual: { label: 'Voce', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
}

const STATUS_ICON = {
  done: '✅',
  active: '🔵',
  pending: '⚪',
  skipped: '⏭️',
}

export function SurpassPlanCard() {
  const { plan, isLoading, generating, generatePlan } = useSurpassPlan()

  if (isLoading) return null

  // Sem plano: botao para gerar
  if (!plan) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-white text-sm">Plano de Superacao</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Descubra o caminho mais rapido para superar seus concorrentes.
            </p>
          </div>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition-all"
            style={{
              background: generating ? 'rgba(255,255,255,0.06)' : 'rgba(168,85,247,0.2)',
              border: '1px solid rgba(168,85,247,0.3)',
              color: generating ? 'var(--text-muted)' : '#C084FC',
            }}
          >
            {generating ? <><Spinner size="sm" /> Gerando...</> : 'Gerar plano'}
          </button>
        </div>
      </div>
    )
  }

  // Plano completo: celebracao
  if (plan.status === 'completed') {
    return (
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}
      >
        <p style={{ fontSize: 28 }}>🎉</p>
        <h3 className="font-display font-bold text-white text-sm mt-2">Plano concluido!</h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          Seu perfil agora e competitivo com os melhores da regiao.
          +{plan.progress.points_gained} pontos conquistados.
        </p>
      </div>
    )
  }

  // Plano ativo
  const { progress, steps } = plan
  const currentScore = plan.current_score + progress.points_gained

  // Agrupar steps por semana
  const weeks = new Map<number, typeof steps>()
  for (const step of steps) {
    const existing = weeks.get(step.week) ?? []
    existing.push(step)
    weeks.set(step.week, existing)
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-white text-sm">Plano de Superacao</h3>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(168,85,247,0.15)', color: '#C084FC' }}
            >
              {plan.days_remaining} dias restantes
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Meta</p>
          <p className="font-display font-bold text-white">{plan.target_score}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-white">{currentScore} pts</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{plan.target_score} pts</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (currentScore / plan.target_score) * 100)}%`,
              background: progress.percentage >= 80
                ? 'linear-gradient(90deg, #4ADE80, #22C55E)'
                : progress.percentage >= 40
                ? 'linear-gradient(90deg, #FBBF24, #F59E0B)'
                : 'linear-gradient(90deg, #38BDF8, #0EA5E9)',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {progress.completed_steps}/{progress.total_steps} etapas
          </span>
          <span className="text-[10px] font-bold" style={{ color: '#4ADE80' }}>
            +{progress.points_gained} pts ganhos
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-1.5">
        {Array.from(weeks.entries()).map(([week, weekSteps]) => (
          <div key={week}>
            {weekSteps.map((step) => {
              const isActive = step.status === 'active'
              const isDone = step.status === 'done'
              const isFuture = step.status === 'pending'
              const badge = MODE_BADGE[step.mode]

              return (
                <div
                  key={step.id}
                  className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 mb-1"
                  style={{
                    background: isActive ? 'rgba(56,189,248,0.06)' : 'transparent',
                    border: isActive ? '1px solid rgba(56,189,248,0.15)' : '1px solid transparent',
                    opacity: isFuture ? 0.45 : 1,
                  }}
                >
                  <span className="mt-0.5 text-xs shrink-0">{STATUS_ICON[step.status]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p
                        className="text-[13px] font-medium"
                        style={{
                          color: isDone ? 'var(--text-tertiary)' : '#fff',
                          textDecoration: isDone ? 'line-through' : 'none',
                        }}
                      >
                        {step.title}
                      </p>
                      <span
                        className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {isActive && (
                      <p className="text-[11px]" style={{ color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                        {step.description}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-[11px] font-bold shrink-0 mt-0.5"
                    style={{ color: isDone ? 'var(--text-muted)' : '#4ADE80' }}
                  >
                    +{step.impact}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
