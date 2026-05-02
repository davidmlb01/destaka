'use client'

import { useState } from 'react'

export function CheckoutButton() {
  const [loading, setLoading] = useState(false)

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        alert(data.error ?? 'Erro ao iniciar checkout. Tente novamente.')
        return
      }
      window.location.href = data.url
    } catch {
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full rounded-xl font-display font-bold py-4 transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
        color: '#fff',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 16,
        letterSpacing: '-0.2px',
        boxShadow: '0 0 24px rgba(217,119,6,0.45), 0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {loading ? 'Redirecionando...' : 'Ativar meu plano'}
    </button>
  )
}
