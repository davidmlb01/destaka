'use client'

import { useState, useCallback } from 'react'
import { StepHero } from '@/components/diagnostico/StepHero'
import { StepLoading } from '@/components/diagnostico/StepLoading'
import { StepScore } from '@/components/diagnostico/StepScore'
import { StepCapture } from '@/components/diagnostico/StepCapture'

type Step = 'hero' | 'loading' | 'score' | 'capture'

interface DiagnosticState {
  clinicName: string
  city: string
  score: number
}

// Score estimado baseado no nome (determinístico por input, varia entre clínicas)
function estimateScore(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  return 35 + Math.abs(hash % 30) // range 35-64
}

export default function DiagnosticoPage() {
  const [step, setStep] = useState<Step>('hero')
  const [state, setState] = useState<DiagnosticState>({
    clinicName: '',
    city: '',
    score: 50,
  })

  function handleStart(clinicName: string, city: string) {
    setState({ clinicName, city, score: estimateScore(clinicName + city) })
    setStep('loading')
    window.scrollTo(0, 0)
  }

  const handleLoadingComplete = useCallback(() => {
    setStep('score')
    window.scrollTo(0, 0)
  }, [])

  function handleCapture() {
    setStep('capture')
    window.scrollTo(0, 0)
  }

  return (
    <>
      {step === 'hero' && (
        <StepHero onStart={handleStart} />
      )}
      {step === 'loading' && (
        <StepLoading
          clinicName={state.clinicName}
          city={state.city}
          onComplete={handleLoadingComplete}
        />
      )}
      {step === 'score' && (
        <StepScore
          clinicName={state.clinicName}
          city={state.city}
          score={state.score}
          onCapture={handleCapture}
        />
      )}
      {step === 'capture' && (
        <StepCapture clinicName={state.clinicName} score={state.score} />
      )}
    </>
  )
}
