'use client'

import { useEffect, useState } from 'react'
import { SectionLabel } from '@/components/ui/SectionLabel'

interface GapFactor {
  factor: string
  label: string
  userValue: number | string
  competitorValue: number | string
  status: 'ahead' | 'behind' | 'tied'
  impact: 'high' | 'medium' | 'low'
  action: string
}

interface GapData {
  competitorName: string
  keyword: string
  factors: GapFactor[]
  summary: string
  userPosition: number | null
  empty?: boolean
}

const STATUS_STYLE = {
  ahead: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', icon: '✓', color: '#34d399' },
  behind: { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', icon: '!', color: '#f87171' },
  tied: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', icon: '=', color: 'var(--text-muted)' },
}

export function GapAnalysisCard() {
  const [data, setData] = useState<GapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/gap')
      .then(r => r.json())
      .then((d: GapData) => setData(d.empty ? null : d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6 flex items-center justify-center"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)', minHeight: 200 }}
      >
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-20 h-3 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="w-32 h-3 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    )
  }

  if (!data) return null

  // Só mostrar onde está atrás (behind). Empatados/à frente não ajudam
  const highImpact = data.factors.filter(f => f.impact === 'high' && f.status === 'behind')
  const otherFactors = data.factors.filter(f => f.impact !== 'high' && f.status === 'behind')

  return (
    <div
      className="rounded-2xl p-6 animate-fade-in-up"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <SectionLabel className="mb-2">O que falta para o 1º lugar</SectionLabel>

      <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
        Comparação com <strong className="text-white">{data.competitorName}</strong> para &ldquo;{data.keyword}&rdquo;
      </p>

      {/* Fatores de alto impacto */}
      <div className="flex flex-col gap-2 mb-4">
        {highImpact.map(f => {
          const style = STATUS_STYLE[f.status]
          return (
            <div
              key={f.factor}
              className="rounded-xl px-4 py-3"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: style.border, color: style.color }}
                  >
                    {style.icon}
                  </span>
                  <span className="text-sm font-medium text-white">{f.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Você: <strong className="text-white">{f.userValue}</strong>
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    vs <strong style={{ color: style.color }}>{f.competitorValue}</strong>
                  </span>
                </div>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{f.action}</p>
            </div>
          )
        })}
      </div>

      {/* Outros fatores */}
      {otherFactors.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {otherFactors.map(f => {
            const style = STATUS_STYLE[f.status]
            return (
              <div
                key={f.factor}
                className="rounded-lg px-3 py-2 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: style.color }}>{style.icon}</span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {f.userValue} vs {f.competitorValue}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Resumo */}
      <div
        className="mt-4 pt-3 rounded-lg px-4 py-3"
        style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.12)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {data.summary}
        </p>
      </div>
    </div>
  )
}
