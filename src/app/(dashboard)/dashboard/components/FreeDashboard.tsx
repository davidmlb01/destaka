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
    <div className="relative pb-20">
      {/* Dashboard real com tratamento por bloco */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <DashboardContent isSubscriber={false} />
      </div>

      {/* Banner de impacto entre score e conteudo bloqueado */}
      <div
        className="max-w-5xl mx-auto px-6 -mt-2 mb-6"
        style={{ position: 'relative', zIndex: 5 }}
      >
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <p className="text-sm text-white">
            <strong>{profileName}</strong> aparece em apenas{' '}
            <strong style={{ color: 'var(--warning)' }}>{visibility}%</strong> das buscas na sua regiao.
            Isso pode representar ate{' '}
            <strong style={{ color: 'var(--error)' }}>{lostMax} {patientWord} perdidos por semana</strong>.
          </p>
        </div>
      </div>

      {/* Sticky CTA bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:left-56"
        style={{
          background: 'rgba(7,26,25,0.95)',
          borderTop: '1px solid rgba(20,184,166,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-white hidden sm:block">
            Ate <strong>{lostMax} {patientWord} novos</strong> por semana. <span style={{ color: 'rgba(255,255,255,0.5)' }}>R$197/mes.</span>
          </p>
          <button
            onClick={handleCheckout}
            className="shrink-0 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:scale-[1.02]"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(20,184,166,0.3)',
            }}
          >
            Ativar Destaka
          </button>
        </div>
      </div>
    </div>
  )
}
