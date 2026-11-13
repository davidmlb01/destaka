'use client'

import { trackBeginCheckout } from '@/lib/tracking/events'
import { useEffect, useState } from 'react'

interface StickyCTAProps {
  score: number
  isSubscriber?: boolean
}

function getCtaText(score: number): string {
  if (score < 30) return 'Corrigir perfil'
  if (score < 50) return 'Começar agora'
  if (score <= 70) return 'Liderar região'
  return 'Manter liderança'
}

export default function StickyCTA({ score, isSubscriber }: StickyCTAProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Spacer mobile */}
      <div className="h-20 md:hidden" />

      {/* CTA fixo mobile */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden"
        style={{
          zIndex: 50,
          background: 'rgba(7,26,25,0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--accent-border)',
          padding: '12px 20px',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 200ms ease-out',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
            {isSubscriber ? 'Falta pouco!' : 'Menos de R$7/dia'}
          </span>
          <button
            onClick={() => {
              if (isSubscriber) {
                window.location.href = '/onboarding?checkout=success'
                return
              }
              trackBeginCheckout()
              fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
              })
                .then(r => r.json())
                .then(d => { if (d.url) window.location.href = d.url; else alert('Erro ao iniciar pagamento. Tente novamente.') })
                .catch(() => alert('Erro de conexão. Verifique sua internet e tente novamente.'))
            }}
            className="font-semibold cursor-pointer"
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 14,
              border: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {isSubscriber ? 'Completar cadastro' : getCtaText(score)}
          </button>
        </div>
      </div>
    </>
  )
}
