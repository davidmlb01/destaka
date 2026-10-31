'use client'

import { memo, type ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: number
  icon: ReactNode
  hint: string
  lastKnownDate?: string | null
}

export const MetricCard = memo(function MetricCard({ label, value, icon, hint, lastKnownDate }: MetricCardProps) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      {/* Subtle ambient glow no canto */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: 80,
          height: 80,
          background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="flex items-start justify-between mb-3 relative">
        <span
          className="flex items-center justify-center rounded-lg text-base"
          style={{
            width: 32,
            height: 32,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {icon}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </span>
      </div>

      {value > 0 ? (
        <>
          <p
            className="font-display font-extrabold text-white relative"
            style={{ fontSize: 30, lineHeight: 1, letterSpacing: '-0.5px' }}
          >
            {value.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
            {label}
          </p>
        </>
      ) : (
        <>
          <p
            className="font-display font-extrabold relative"
            style={{ fontSize: 30, lineHeight: 1, letterSpacing: '-0.5px', color: 'rgba(255,255,255,0.3)' }}
          >
            -
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
            {label}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {lastKnownDate ? `Sem dados desde ${lastKnownDate}` : 'Disponivel em breve'}
          </p>
        </>
      )}
    </div>
  )
})
