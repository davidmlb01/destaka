'use client'

import { DashboardContent } from '@/components/dashboard/DashboardContent'

interface FreeDashboardProps {
  score: number
  profileName: string
  specialty: string
}

function getVisibilityPercent(score: number): number {
  return Math.round(10 + (score / 100) * 80)
}

function getLostPatientsRange(score: number): [number, number] {
  const visibility = getVisibilityPercent(score) / 100
  const weeklySearches = 20
  const conversionRate = 0.15
  const missedSearches = weeklySearches * (1 - visibility)
  const lostMin = Math.max(1, Math.floor(missedSearches * conversionRate * 0.7))
  const lostMax = Math.ceil(missedSearches * conversionRate * 1.3)
  return [lostMin, lostMax]
}

export function FreeDashboard({ score, profileName, specialty }: FreeDashboardProps) {
  const visibility = getVisibilityPercent(score)
  const [, lostMax] = getLostPatientsRange(score)
  const patientWord = specialty === 'veterinario' ? 'clientes' : 'pacientes'

  async function handleCheckout() {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('[FreeDashboard] Checkout error:', err)
    }
  }

  return (
    <div className="relative">
      {/* Dashboard real com blur */}
      <div
        className="max-w-5xl mx-auto px-6 py-8 space-y-6"
        style={{
          filter: 'blur(6px)',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.6,
        }}
      >
        <DashboardContent />
      </div>

      {/* Overlay escuro gradiente */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(180deg, rgba(7,26,25,0.3) 0%, rgba(7,26,25,0.85) 50%, rgba(7,26,25,0.95) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* CTA flutuante */}
      <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(7,26,25,0.95)',
            border: '1px solid rgba(20,184,166,0.25)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          {/* Score resumido */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-4xl font-bold text-white">{score}</span>
            <span className="text-lg" style={{ color: 'rgba(255,255,255,0.3)' }}>/100</span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: 'var(--error)' }}>
            Score Destaka
          </p>

          {/* Dados de impacto */}
          <div
            className="rounded-xl p-5 mb-6 text-left"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <p className="text-sm text-white mb-2">
              <strong>{profileName}</strong> aparece em apenas{' '}
              <strong style={{ color: 'var(--warning)' }}>{visibility}%</strong> das buscas na sua regiao.
            </p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Isso pode representar ate{' '}
              <strong className="text-white">{lostMax} {patientWord} perdidos por semana</strong>{' '}
              que nao encontram voce no Google.
            </p>
          </div>

          {/* CTA principal */}
          <p className="text-base font-semibold text-white mb-2">
            O Destaka encontrou melhorias no seu perfil que podem levar ate {lostMax} {patientWord} novos por semana para o seu consultorio.
          </p>

          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Tudo no piloto automatico. Sem voce precisar parar de atender.
          </p>

          <button
            onClick={handleCheckout}
            className="w-full px-6 py-4 rounded-xl text-sm font-bold transition-all cursor-pointer hover:scale-[1.02]"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(20,184,166,0.3)',
            }}
          >
            Ativar Destaka por R$197/mes
          </button>

          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Cancele quando quiser. Sem multa, sem burocracia.
          </p>
        </div>
      </div>
    </div>
  )
}
