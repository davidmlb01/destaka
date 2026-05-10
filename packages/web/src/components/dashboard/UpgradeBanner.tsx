'use client'

import { useState } from 'react'

export function UpgradeBanner() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      })
      if (!res.ok) {
        setError('Não foi possível iniciar o checkout. Tente novamente.')
        return
      }
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError('Não foi possível iniciar o checkout. Tente novamente.')
    } catch {
      setError('Não foi possível iniciar o checkout. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(14,165,233,0.05) 100%)',
        border: '1px solid rgba(14,165,233,0.3)',
      }}
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span style={{ color: 'var(--accent)', fontSize: 14 }}>✦</span>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent-bright)' }}>
            Plano gratuito
          </p>
        </div>
        <p className="font-display font-extrabold text-white" style={{ fontSize: 18 }}>
          Seu perfil está sendo monitorado. Quer corrigir automaticamente?
        </p>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          R$197/mês. Garantia de 30 dias. Uma consulta cobre 6 meses de Destaka.
        </p>
      </div>

      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--error)' }}>{error}</p>
      )}

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="shrink-0 rounded-xl px-5 py-3 font-display font-extrabold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
        style={{
          background: loading ? 'rgba(14,165,233,0.5)' : 'linear-gradient(135deg, var(--accent-hover) 0%, var(--accent) 100%)',
          color: '#1C1917',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(14,165,233,0.4)',
        }}
      >
        {loading ? 'Aguarde...' : 'Assinar Pro — R$197/mês'}
      </button>
    </div>
  )
}
