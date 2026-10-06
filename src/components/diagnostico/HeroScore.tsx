'use client'

import { useEffect, useRef, useState } from 'react'

interface HeroScoreProps {
  score: number
  projetado: number
  nome: string
  endereco: string
}

function useCountUp(target: number, duration = 1200) {
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [value, setValue] = useState(reducedMotion ? target : 0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reducedMotion) return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, { threshold: 0.3 })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration, reducedMotion])

  return { value, ref }
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--success)'
  if (score >= 40) return 'var(--warning)'
  return 'var(--error)'
}

function getScoreMessage(score: number, nome: string): string {
  if (score < 30) return `${nome}, seu perfil está praticamente invisível no Google. A maioria dos seus clientes em potencial não te encontra.`
  if (score < 50) return `${nome}, seu perfil aparece para menos da metade das pessoas que procuram pelo seu serviço na sua região.`
  if (score < 70) return `${nome}, seu perfil tem potencial, mas está perdendo clientes para concorrentes mais visíveis.`
  return `${nome}, seu perfil está bem posicionado. Com o Destaka, você mantém essa liderança.`
}

export default function HeroScore({ score, projetado, nome, endereco }: HeroScoreProps) {
  const { value: animatedScore, ref } = useCountUp(score)
  const scoreColor = getScoreColor(score)
  const gap = projetado - score

  return (
    <section ref={ref} className="text-center">
      {/* Nome e endereço do perfil */}
      <p style={{ fontSize: 14, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        Diagnóstico de visibilidade
      </p>
      <h2
        className="font-display font-bold"
        style={{ fontSize: 22, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}
      >
        {nome}
      </h2>
      {endereco && (
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 32 }}>
          {endereco}
        </p>
      )}

      {/* Score grande, centralizado, protagonista */}
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 48px',
          borderRadius: 20,
          border: `2px solid ${scoreColor}`,
          background: 'var(--card-subtle)',
        }}
      >
        <span
          className="font-mono font-bold"
          style={{ fontSize: 80, lineHeight: 1, color: scoreColor, letterSpacing: '-2px' }}
        >
          {animatedScore}
        </span>
        <span style={{ fontSize: 18, color: 'var(--text-tertiary)', marginTop: 4 }}>de 100</span>
      </div>

      {/* Mensagem de impacto */}
      <p
        className="mx-auto"
        style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginTop: 24,
          maxWidth: 520,
        }}
      >
        {getScoreMessage(score, nome)}
      </p>

      {/* Projeção */}
      {gap > 0 && (
        <div
          className="mx-auto"
          style={{
            marginTop: 20,
            padding: '12px 24px',
            borderRadius: 12,
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)',
            maxWidth: 440,
          }}
        >
          <p style={{ fontSize: 15, color: 'var(--accent-bright)' }}>
            Com ajustes que o Destaka aplica automaticamente, seu score pode chegar a <strong style={{ fontFamily: 'var(--font-geist-mono)', fontSize: 17 }}>{projetado}</strong>/100
          </p>
        </div>
      )}
    </section>
  )
}
