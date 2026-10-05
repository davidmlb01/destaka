'use client'

import { useEffect, useRef, useState } from 'react'
import ProgressBar from './ProgressBar'
import type { DiagGap } from './useDiagnostico'

interface ScoreBlockProps {
  score: number
  projectedScore: number
  gaps: DiagGap[]
  especialidade: string
}

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || started.current) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setCount(target)
      started.current = true
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()
          const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            // ease-out
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
          observer.unobserve(el)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

export default function ScoreBlock({ score, projectedScore, gaps, especialidade }: ScoreBlockProps) {
  const atual = useCountUp(score)
  const projetado = useCountUp(projectedScore)
  const gapValue = projectedScore - score
  const top5 = gaps.slice(0, 5)
  const somaImpact = top5.reduce((sum, g) => sum + g.impact, 0)

  return (
    <section aria-labelledby="score-heading">
      <h2
        id="score-heading"
        className="font-display font-bold mb-6"
        style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px' }}
      >
        Seu score de visibilidade
      </h2>

      <div
        className="rounded-2xl p-6 md:p-8"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-accent)' }}
      >
        {/* Score cards */}
        <div className="flex flex-row gap-4 justify-center max-w-[600px] mx-auto mb-6">
          {/* Hoje */}
          <div className="flex-1 text-center">
            <p
              className="uppercase mb-2"
              style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '1px', lineHeight: 1.4 }}
            >
              HOJE
            </p>
            <p className="font-mono font-bold" style={{ fontSize: 48, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
              <span ref={atual.ref}>{atual.count}</span>
            </p>
            <p className="font-mono" style={{ fontSize: 18, color: 'var(--text-tertiary)' }}>/100</p>
          </div>

          {/* Com Destaka */}
          <div className="flex-1 text-center">
            <p
              className="uppercase mb-2"
              style={{ fontSize: 12, color: 'var(--accent-bright)', letterSpacing: '1px', lineHeight: 1.4 }}
            >
              COM DESTAKA
            </p>
            <p className="font-mono font-bold" style={{ fontSize: 48, lineHeight: 1, color: 'var(--success)', letterSpacing: '-1px' }}>
              <span ref={projetado.ref}>{projetado.count}</span>
            </p>
            <p className="font-mono" style={{ fontSize: 18, color: 'var(--text-tertiary)' }}>/100</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="max-w-[600px] mx-auto mb-2">
          <ProgressBar value={score} max={100} projectedValue={projectedScore} />
        </div>

        {/* Body copy */}
        <p className="mt-6" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Hoje, apenas {score}% do seu potencial esta sendo aproveitado. Isso significa que a maioria dos pacientes que procuram por {especialidade} na sua regiao encontra seus concorrentes primeiro.
        </p>

        {gapValue > 0 && (
          <p className="mt-3" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Voce esta {gapValue} pontos abaixo do que seu perfil pode alcancar. Esses pontos sao pacientes que procuram por voce e nao te encontram.
          </p>
        )}

        {/* 5 ajustes rapidos */}
        {top5.length > 0 && (
          <div className="mt-8">
            <h3
              className="font-display font-medium mb-3"
              style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.4 }}
            >
              5 ajustes que o Destaka faz em 24h
            </h3>

            <p className="mb-4" style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Identificamos {gaps.length} oportunidades no seu perfil. Estas sao as 5 com maior impacto imediato:
            </p>

            <ol className="space-y-3">
              {top5.map((gap, i) => (
                <li key={i} className="flex items-start gap-3" style={{ paddingLeft: 0 }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 mt-0.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {gap.message} <span style={{ color: 'var(--accent-bright)' }}>(+{gap.impact} pts)</span>
                  </span>
                </li>
              ))}
            </ol>

            {somaImpact > 0 && (
              <p className="mt-4" style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Juntos, esses ajustes podem aumentar seu score em ate {somaImpact} pontos. O Destaka aplica todos automaticamente.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
