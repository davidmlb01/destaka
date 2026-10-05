'use client'

import { useEffect, useRef, useState } from 'react'

interface ProgressBarProps {
  value: number
  max: number
  projectedValue?: number
}

export default function ProgressBar({ value, max, projectedValue }: ProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)

  const pct = Math.min(Math.round((value / max) * 100), 100)
  const projPct = projectedValue ? Math.min(Math.round((projectedValue / max) * 100), 100) : undefined

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setAnimated(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setAnimated(true), 200)
          observer.unobserve(el)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="relative w-full"
      style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Score ${value} de ${max}`}
    >
      {/* Projetado (dashed, atras) */}
      {projPct !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: 8,
            borderRadius: 4,
            width: animated ? `${projPct}%` : '0%',
            transition: 'width 600ms ease-out',
            background: 'repeating-linear-gradient(90deg, var(--success) 0px, var(--success) 4px, transparent 4px, transparent 8px)',
            opacity: 0.5,
          }}
        />
      )}
      {/* Atual */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 8,
          borderRadius: 4,
          width: animated ? `${pct}%` : '0%',
          transition: 'width 600ms ease-out',
          background: 'var(--accent)',
          boxShadow: '0 0 8px rgba(20,184,166,0.4)',
        }}
      />
    </div>
  )
}
