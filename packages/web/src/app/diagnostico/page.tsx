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

// Mock score — será substituído pela API do Google Business Profile (Block 1)
const MOCK_SCORE = 55

export default function DiagnosticoPage() {
  const [step, setStep] = useState<Step>('hero')
  const [state, setState] = useState<DiagnosticState>({
    clinicName: '',
    city: '',
    score: MOCK_SCORE,
  })

  function handleStart(clinicName: string, city: string) {
    setState(prev => ({ ...prev, clinicName, city }))
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
        <StepCapture />
      )}
    </>
  )
}
