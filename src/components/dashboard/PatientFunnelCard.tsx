'use client'

import { useEffect, useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'

interface FunnelData {
  current: {
    week_start: string
    impressions: number
    views_maps: number
    views_search: number
    actions_phone: number
    actions_directions: number
    actions_website: number
    actions_total: number
  }
  previous: {
    week_start: string
    impressions: number
    actions_total: number
  } | null
  deltas: {
    impressions_pct: number | null
    actions_abs: number | null
  }
  empty?: boolean
}

function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR')
}

function DeltaBadge({ label, value, unit }: { label: string; value: number | null; unit: 'pct' | 'abs' }) {
  if (value === null) return null
  const isPositive = value > 0
  const color = isPositive ? '#10b981' : value < 0 ? '#ef4444' : 'rgba(255,255,255,0.4)'
  const sign = isPositive ? '+' : ''
  const formatted = unit === 'pct' ? `${sign}${value}%` : `${sign}${value}`

  return (
    <span className="text-xs font-medium" style={{ color }}>
      {formatted} {label}
    </span>
  )
}

export function PatientFunnelCard() {
  const [data, setData] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/funnel')
      .then(r => r.json())
      .then((d: FunnelData) => {
        if (d.empty) {
          setData(null)
        } else {
          setData(d)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6 flex items-center justify-center"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)', minHeight: 280 }}
      >
        <Spinner />
      </div>
    )
  }

  if (error) return null

  if (!data) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
      >
        <p
          className="text-xs font-bold tracking-[0.12em] uppercase mb-3"
          style={{ color: 'rgba(255,255,255,0.38)' }}
        >
          Seus pacientes
        </p>
        <div className="flex flex-col items-center py-8 text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Dados sendo coletados. O primeiro relatório aparece na próxima segunda-feira.
          </p>
        </div>
      </div>
    )
  }

  const { current, deltas } = data
  const totalViews = current.views_maps + current.views_search

  return (
    <div
      className="rounded-2xl p-6 animate-fade-in-up"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <p
        className="text-xs font-bold tracking-[0.12em] uppercase mb-5"
        style={{ color: 'rgba(255,255,255,0.38)' }}
      >
        Seus pacientes esta semana
      </p>

      {/* Funil vertical */}
      <div className="flex flex-col gap-1">

        {/* Nivel 1: Encontraram */}
        <div
          className="rounded-xl px-5 py-4"
          style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.12)' }}
        >
          <p
            className="font-display font-extrabold text-white"
            style={{ fontSize: 32, lineHeight: 1, letterSpacing: '-0.5px' }}
          >
            {formatNumber(current.impressions)}
          </p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            pessoas te encontraram no Google
          </p>
        </div>

        {/* Seta */}
        <div className="flex justify-center py-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v10M4 9l4 4 4-4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Nivel 2: Viram o perfil */}
        <div
          className="rounded-xl px-5 py-4"
          style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.08)' }}
        >
          <p
            className="font-display font-extrabold text-white"
            style={{ fontSize: 28, lineHeight: 1, letterSpacing: '-0.5px' }}
          >
            {formatNumber(totalViews)}
          </p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            viram seu perfil
          </p>
        </div>

        {/* Seta */}
        <div className="flex justify-center py-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v10M4 9l4 4 4-4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Nivel 3: Tomaram acao */}
        <div
          className="rounded-xl px-5 py-4"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)' }}
        >
          <p
            className="font-display font-extrabold text-white"
            style={{ fontSize: 28, lineHeight: 1, letterSpacing: '-0.5px' }}
          >
            {formatNumber(current.actions_total)}
          </p>
          <p className="text-sm mt-1 mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
            tomaram uma acao
          </p>

          {/* Detalhamento das acoes */}
          <div className="flex flex-wrap gap-4">
            {current.actions_phone > 0 && (
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {current.actions_phone} ligaram
                </span>
              </div>
            )}
            {current.actions_directions > 0 && (
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {current.actions_directions} pediram rota
                </span>
              </div>
            )}
            {current.actions_website > 0 && (
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {current.actions_website} clicaram no site
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparativo com semana anterior */}
      {(deltas.impressions_pct !== null || deltas.actions_abs !== null) && (
        <div className="mt-4 pt-3 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>vs semana passada:</span>
          <div className="flex items-center gap-3">
            <DeltaBadge label="impressoes" value={deltas.impressions_pct} unit="pct" />
            <DeltaBadge label="acoes" value={deltas.actions_abs} unit="abs" />
          </div>
        </div>
      )}
    </div>
  )
}
