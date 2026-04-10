'use client'

import { useState } from 'react'

export function UpgradeBanner() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(217,119,6,0.15) 0%, rgba(217,119,6,0.05) 100%)',
        border: '1px solid rgba(217,119,6,0.3)',
      }}
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span style={{ color: '#F59E0B', fontSize: 14 }}>✦</span>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#FCD34D' }}>
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

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="shrink-0 rounded-xl px-5 py-3 font-display font-extrabold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
        style={{
          background: loading ? 'rgba(217,119,6,0.5)' : 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
          color: '#1C1917',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(217,119,6,0.4)',
        }}
      >
        {loading ? 'Aguarde...' : 'Assinar Pro — R$197/mês'}
      </button>
    </div>
  )
}
