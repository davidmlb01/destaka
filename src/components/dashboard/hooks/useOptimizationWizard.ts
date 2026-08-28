import { useState } from 'react'
import type { OptimizationPlan, ExecutionResult } from '@/lib/gmb/optimizer'

type Step = 'idle' | 'loading-plan' | 'preview' | 'executing' | 'done' | 'error'

interface ExecutionState {
  results: ExecutionResult[]
  scoreBefore: number
  scoreAfter: number
}

export function useOptimizationWizard(
  profileId: string,
  diagnosticId: string,
  onComplete?: () => void,
) {
  const [step, setStep] = useState<Step>('idle')
  const [plan, setPlan] = useState<OptimizationPlan | null>(null)
  const [execution, setExecution] = useState<ExecutionState | null>(null)
  const [currentActionIndex, setCurrentActionIndex] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  async function openWizard() {
    setStep('loading-plan')
    setErrorMsg('')
    try {
      const res = await fetch('/api/optimization/plan')
      if (!res.ok) {
        setErrorMsg('Não foi possível gerar o plano. Execute um diagnóstico primeiro.')
        setStep('error')
        return
      }
      const data = (await res.json()) as OptimizationPlan
      setPlan(data)
      setStep('preview')
    } catch {
      setErrorMsg('Erro de conexão. Verifique sua internet e tente novamente.')
      setStep('error')
    }
  }

  async function startExecution() {
    if (!plan) return
    setStep('executing')
    setCurrentActionIndex(0)

    const actionCount = plan.actions.length
    for (let i = 0; i < actionCount; i++) {
      setCurrentActionIndex(i)
      await new Promise((r) => setTimeout(r, 800))
    }

    try {
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

      const data = (await res.json()) as ExecutionState
      setExecution(data)
      setStep('done')
    } catch {
      setErrorMsg('Erro de conexão durante execução. Tente novamente.')
      setStep('error')
    }
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

  return {
    step,
    plan,
    execution,
    currentActionIndex,
    errorMsg,
    openWizard,
    startExecution,
    reset,
    handleComplete,
  }
}
