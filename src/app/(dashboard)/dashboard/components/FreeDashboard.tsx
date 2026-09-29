'use client'

interface FreeDashboardProps {
  score: number
  profileName: string
  specialty: string
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Forte'
  if (score >= 60) return 'Bom'
  if (score >= 40) return 'Funcional'
  if (score >= 20) return 'Fraco'
  return 'Critico'
}

function getVisibilityPercent(score: number): number {
  // Estimativa conservadora: score 100 = 90% das buscas, score 0 = 10%
  return Math.round(10 + (score / 100) * 80)
}

function getLostPatientsRange(score: number): [number, number] {
  // Baseado em: 20 buscas/semana na regiao, conversao 15%
  // Pacientes perdidos = buscas nao alcancadas * conversao
  const visibility = getVisibilityPercent(score) / 100
  const weeklySearches = 20
  const conversionRate = 0.15
  const missedSearches = weeklySearches * (1 - visibility)
  const lostMin = Math.max(1, Math.floor(missedSearches * conversionRate * 0.7))
  const lostMax = Math.ceil(missedSearches * conversionRate * 1.3)
  return [lostMin, lostMax]
}

export function FreeDashboard({ score, profileName, specialty }: FreeDashboardProps) {
  const label = getScoreLabel(score)
  const visibility = getVisibilityPercent(score)
  const [lostMin, lostMax] = getLostPatientsRange(score)

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
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Score principal */}
      <div
        className="rounded-2xl p-8 text-center mb-8"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <p className="text-sm font-medium mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Score Destaka
        </p>

        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-6xl font-bold text-white">{score}</span>
          <span className="text-2xl font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>/100</span>
        </div>

        <p
          className="text-sm font-semibold mb-8"
          style={{
            color: score >= 60 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--error)',
          }}
        >
          {label}
        </p>

        <div
          className="rounded-xl p-6 text-left"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="text-sm text-white mb-3">
            Com esse score, <strong>{profileName}</strong> aparece em apenas{' '}
            <strong style={{ color: 'var(--warning)' }}>{visibility}%</strong> das buscas na sua regiao.
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Isso representa aproximadamente{' '}
            <strong className="text-white">{lostMin} a {lostMax} {patientWord}</strong>{' '}
            que procuram um profissional como voce toda semana e nao encontram sua clinica.
          </p>
        </div>
      </div>

      {/* Teaser de acoes */}
      <div
        className="rounded-2xl p-6 mb-8"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Proximas acoes
        </p>
        <p className="text-sm text-white mb-1">
          O Destaka encontrou melhorias para o seu perfil.
        </p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Ative sua assinatura para aplicar automaticamente.
        </p>
      </div>

      {/* CTA */}
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: 'rgba(20,184,166,0.08)',
          border: '1px solid rgba(20,184,166,0.2)',
        }}
      >
        <p className="text-lg font-semibold text-white mb-2">
          Pare de perder {patientWord}
        </p>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
          O Destaka otimiza seu perfil automaticamente, responde avaliacoes,
          publica posts e monitora concorrentes. Tudo no piloto automatico.
        </p>

        <button
          onClick={handleCheckout}
          className="px-8 py-3.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer hover:opacity-90"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Ativar Destaka por R$197/mes
        </button>

        <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Cancele quando quiser. Sem multa, sem burocracia.
        </p>
      </div>
    </div>
  )
}
