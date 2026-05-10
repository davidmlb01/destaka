'use client'

import { useState, useCallback } from 'react'
import { StepHero } from '@/components/diagnostico/StepHero'
import { StepLoading } from '@/components/diagnostico/StepLoading'
import { StepScore } from '@/components/diagnostico/StepScore'
import { StepCapture } from '@/components/diagnostico/StepCapture'

type Step = 'hero' | 'loading' | 'score' | 'capture' | 'error'

interface ScoreCategory {
  name: string
  label: string
  score: number
  maxScore: number
}

interface DiagnosticResult {
  clinicName: string
  city: string
  score: number
  categories: ScoreCategory[]
  place: {
    rating: number | null
    reviewsTotal: number | null
    website: string | null
  }
}

export default function DiagnosticoPage() {
  const [step, setStep] = useState<Step>('hero')
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [query, setQuery] = useState({ clinicName: '', city: '' })
  const [errorMsg, setErrorMsg] = useState('')

  function handleStart(clinicName: string, city: string) {
    setQuery({ clinicName, city })
    setStep('loading')
    window.scrollTo(0, 0)

    // Chamada real à API enquanto animação roda
    fetch('/api/public/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: `${clinicName} ${city}` }),
    })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string }
          throw new Error(data.error ?? 'Não foi possível encontrar o estabelecimento.')
        }
        return res.json()
      })
      .then(data => {
        setResult({
          clinicName: data.place?.name ?? clinicName,
          city,
          score: data.score?.total ?? 0,
          categories: data.score?.categories ?? [],
          place: {
            rating: data.place?.rating ?? null,
            reviewsTotal: data.place?.reviewsTotal ?? null,
            website: data.place?.website ?? null,
          },
        })
      })
      .catch(err => {
        setErrorMsg(err.message ?? 'Erro ao analisar o perfil.')
        setStep('error')
      })
  }

  const handleLoadingComplete = useCallback(() => {
    if (result) {
      setStep('score')
      window.scrollTo(0, 0)
    }
    // Se result ainda não chegou, StepLoading vai aguardar
  }, [result])

  function handleCapture() {
    setStep('capture')
    window.scrollTo(0, 0)
  }

  function handleRetry() {
    setStep('hero')
    setErrorMsg('')
    setResult(null)
  }

  return (
    <>
      {step === 'hero' && (
        <StepHero onStart={handleStart} />
      )}
      {step === 'loading' && (
        <StepLoading
          clinicName={query.clinicName}
          city={query.city}
          onComplete={handleLoadingComplete}
          ready={!!result}
        />
      )}
      {step === 'score' && result && (
        <StepScore
          clinicName={result.clinicName}
          city={result.city}
          score={result.score}
          categories={result.categories}
          place={result.place}
          onCapture={handleCapture}
        />
      )}
      {step === 'capture' && result && (
        <StepCapture clinicName={result.clinicName} score={result.score} />
      )}
      {step === 'error' && (
        <section className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-gradient)' }}>
          <div className="text-center max-w-md">
            <p className="text-[40px] mb-6">⚠️</p>
            <h2 className="font-display font-extrabold text-white text-2xl mb-3">{errorMsg}</h2>
            <p className="text-[15px] mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Tente digitar o nome completo da clínica e a cidade.
            </p>
            <button
              onClick={handleRetry}
              className="px-8 py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'var(--accent-hover)' }}
            >
              Tentar novamente
            </button>
          </div>
        </section>
      )}
    </>
  )
}
