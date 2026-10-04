'use client'

import { DashboardContent } from '@/components/dashboard/DashboardContent'

interface FreeDashboardProps {
  score: number
  profileName: string
  specialty: string
  isNewUser?: boolean
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

export function FreeDashboard({ score, profileName, specialty, isNewUser }: FreeDashboardProps) {
  const hasData = score > 0 && !isNewUser

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

  // Novo usuário sem score calculado ainda
  if (!hasData) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(20,184,166,0.15)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Analisando {profileName}
          </h2>
          <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Estamos coletando dados do seu perfil no Google. Isso leva alguns minutos.
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Recarregue a página em instantes para ver seu diagnóstico
          </p>
        </div>
      </div>
    )
  }

  const visibility = getVisibilityPercent(score)
  const [, lostMax] = getLostPatientsRange(score)
  const invisible = 100 - visibility

  const impactText = `Você está invisível para ${invisible}% das pessoas que procuram o que você faz. São no mínimo ${lostMax} clientes por semana indo direto para o concorrente.`

  return (
    <div className="relative pb-20">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <DashboardContent
          isSubscriber={false}
          onCheckout={handleCheckout}
          impactText={impactText}
        />
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
            No mínimo <strong>{lostMax} clientes novos</strong> por semana.{' '}
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Menos de R$7 por dia.</span>
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
            Quero mais clientes
          </button>
        </div>
      </div>
    </div>
  )
}
