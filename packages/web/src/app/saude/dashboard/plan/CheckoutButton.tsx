'use client'

import { useState } from 'react'

export function CheckoutButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Não foi possível iniciar o checkout. Tente novamente.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full rounded-xl font-display font-bold py-4 transition-all hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, var(--accent-hover) 0%, var(--accent) 100%)',
          color: '#fff',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 16,
          letterSpacing: '-0.2px',
          boxShadow: '0 0 24px rgba(14,165,233,0.45), 0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        {loading ? 'Redirecionando...' : 'Ativar meu plano'}
      </button>
      {error && (
        <div
          className="mt-3 px-4 py-3 rounded-lg text-[13px] font-medium animate-fade-in-up"
          style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
