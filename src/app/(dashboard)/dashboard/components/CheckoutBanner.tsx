'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function CheckoutBanner({ status }: { status: string }) {
  const router = useRouter()

  // Remove query param after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/dashboard', { scroll: false })
    }, 8000)
    return () => clearTimeout(timer)
  }, [router])

  if (status === 'success') {
    return (
      <div
        className="rounded-xl px-5 py-4 mb-4 flex items-center gap-3"
        style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}
      >
        <span style={{ color: '#4ADE80' }}>{'\u2713'}</span>
        <p className="text-sm" style={{ color: '#4ADE80' }}>
          Pagamento confirmado. Seu Destaka está ativo.
        </p>
      </div>
    )
  }

  if (status === 'cancel') {
    return (
      <div
        className="rounded-xl px-5 py-4 mb-4 flex items-center gap-3"
        style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}
      >
        <span style={{ color: '#FBBF24' }}>!</span>
        <p className="text-sm" style={{ color: '#FBBF24' }}>
          Pagamento cancelado. Você pode tentar novamente quando quiser.
        </p>
      </div>
    )
  }

  return null
}
