'use client'

import { useState } from 'react'
import type { OptimizationAction, OptimizationPlan, ExecutionResult } from '@/lib/gmb/optimizer'

type Step = 'idle' | 'loading-plan' | 'preview' | 'executing' | 'done' | 'error'

interface ExecutionState {
  results: ExecutionResult[]
  scoreBefore: number
  scoreAfter: number
}

const ACTION_ICONS: Record<string, string> = {
  update_hours: '🕐',
  update_categories: '🏷️',
  update_attributes: '✅',
  update_description: '✍️',
  add_services: '🏥',
}

export function OptimizationWizard({ profileId, diagnosticId, onComplete }: {
  profileId: string
  diagnosticId: string
  onComplete?: () => void
}) {
  const [step, setStep] = useState<Step>('idle')
  const [plan, setPlan] = useState<OptimizationPlan | null>(null)
  const [execution, setExecution] = useState<ExecutionState | null>(null)
  const [currentActionIndex, setCurrentActionIndex] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  async function openWizard() {
    setStep('loading-plan')
    setErrorMsg('')

    const res = await fetch('/api/optimization/plan')
    if (!res.ok) {
      setErrorMsg('Não foi possível gerar o plano. Execute um diagnóstico primeiro.')
      setStep('error')
      return
    }

    const data = await res.json() as OptimizationPlan
    setPlan(data)
    setStep('preview')
  }

  async function startExecution() {
    if (!plan) return
    setStep('executing')
    setCurrentActionIndex(0)

    // Progresso simulado por polling
    const actionCount = plan.actions.length
    for (let i = 0; i < actionCount; i++) {
      setCurrentActionIndex(i)
      await new Promise(r => setTimeout(r, 800))
    }

    const res = await fetch('/api/optimization/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        diagnosticId,
        actions: plan.actions,
      }),
    })

    if (!res.ok) {
      setErrorMsg('Erro durante execução. Tente novamente.')
      setStep('error')
      return
    }

    const data = await res.json() as ExecutionState
    setExecution(data)
    setStep('done')
  }

  function reset() {
    setStep('idle')
    setPlan(null)
    setExecution(null)
    setCurrentActionIndex(0)
  }

  function handleComplete() {
    reset()
    onComplete?.()
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (step === 'idle') {
    return (
      <button
        onClick={openWizard}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(217,119,6,0.25) 0%, rgba(217,119,6,0.15) 100%)',
          border: '1px solid rgba(217,119,6,0.35)',
          color: '#FCD34D',
        }}
      >
        <span>⚡</span>
        Otimizar Automaticamente
      </button>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--modal-bg)', border: '1px solid var(--border-card)' }}
      >

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-5">
          <span style={{ fontSize: 22 }}>⚡</span>
          <div>
            <h2 className="font-display font-bold text-white" style={{ fontSize: 17 }}>
              Otimização Automática
            </h2>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {step === 'loading-plan' && 'Analisando perfil...'}
              {step === 'preview' && `${plan?.actions.length} ações identificadas`}
              {step === 'executing' && `Executando ${currentActionIndex + 1} de ${plan?.actions.length}...`}
              {step === 'done' && 'Concluído!'}
              {step === 'error' && 'Algo deu errado'}
            </p>
          </div>
        </div>

        {/* Loading plan */}
        {step === 'loading-plan' && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'rgba(252,211,77,0.3)', borderTopColor: '#FCD34D' }} />
          </div>
        )}

        {/* Preview */}
        {step === 'preview' && plan && (
          <>
            {/* Score projection */}
            <div
              className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between"
              style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}
            >
              <div className="text-center">
                <p className="font-display font-extrabold text-white" style={{ fontSize: 22 }}>{plan.currentScore}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Score atual</p>
              </div>
              <span style={{ color: '#4ADE80', fontSize: 18 }}>→</span>
              <div className="text-center">
                <p className="font-display font-extrabold" style={{ fontSize: 22, color: '#4ADE80' }}>{plan.projectedScore}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Score projetado</p>
              </div>
              <div className="text-center">
                <p className="font-display font-extrabold" style={{ fontSize: 16, color: '#4ADE80' }}>
                  +{plan.projectedScore - plan.currentScore}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>pontos</p>
              </div>
            </div>

            {/* Lista de ações */}
            <div className="flex flex-col gap-2 mb-5">
              {plan.actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <span style={{ fontSize: 16 }}>{ACTION_ICONS[action.type] ?? '🔧'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{action.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{action.description}</p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: '#4ADE80' }}>+{action.impact}pts</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
              >
                Cancelar
              </button>
              <button
                onClick={startExecution}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                style={{ background: 'rgba(217,119,6,0.25)', border: '1px solid rgba(217,119,6,0.4)', color: '#FCD34D' }}
              >
                Confirmar e Otimizar
              </button>
            </div>
          </>
        )}

        {/* Executing */}
        {step === 'executing' && plan && (
          <div className="flex flex-col gap-2">
            {plan.actions.map((action, i) => {
              const done = i < currentActionIndex
              const active = i === currentActionIndex
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                  style={{
                    background: active ? 'rgba(252,211,77,0.08)' : 'rgba(255,255,255,0.04)',
                    border: active ? '1px solid rgba(252,211,77,0.2)' : '1px solid transparent',
                    opacity: i > currentActionIndex ? 0.4 : 1,
                  }}
                >
                  <span style={{ fontSize: 16 }}>
                    {done ? '✅' : active ? (
                      <span className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: 'rgba(252,211,77,0.3)', borderTopColor: '#FCD34D' }} />
                    ) : ACTION_ICONS[action.type]}
                  </span>
                  <p className="text-sm font-medium text-white">{action.label}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Done */}
        {step === 'done' && execution && (
          <>
            <div
              className="rounded-xl px-4 py-4 mb-4 text-center"
              style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}
            >
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Score atualizado</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-display font-extrabold text-white" style={{ fontSize: 28 }}>
                  {execution.scoreBefore}
                </span>
                <span style={{ color: '#4ADE80', fontSize: 20 }}>→</span>
                <span className="font-display font-extrabold" style={{ fontSize: 28, color: '#4ADE80' }}>
                  {execution.scoreAfter}
                </span>
              </div>
              <p className="text-sm font-bold mt-1" style={{ color: '#4ADE80' }}>
                +{execution.scoreAfter - execution.scoreBefore} pontos conquistados
              </p>
            </div>

            <div className="flex flex-col gap-1.5 mb-5">
              {execution.results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>{r.status === 'done' ? '✅' : '❌'}</span>
                  <span style={{ color: r.status === 'done' ? 'rgba(255,255,255,0.7)' : '#FB923C' }}>
                    {r.action.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              className="w-full rounded-xl py-2.5 text-sm font-bold"
              style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ADE80' }}
            >
              Ver dashboard atualizado
            </button>
          </>
        )}

        {/* Error */}
        {step === 'error' && (
          <>
            <p className="text-sm mb-5" style={{ color: '#FB923C' }}>{errorMsg}</p>
            <button
              onClick={reset}
              className="w-full rounded-xl py-2.5 text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              Fechar
            </button>
          </>
        )}

      </div>
    </div>
  )
}
