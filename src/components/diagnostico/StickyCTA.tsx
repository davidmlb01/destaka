'use client'

import { useEffect, useRef, useState } from 'react'

interface StickyCTAProps {
  score: number
}

function getCtaButtonText(score: number): string {
  if (score < 30) return 'Corrigir perfil'
  if (score <= 50) return 'Comecar agora'
  if (score <= 70) return 'Liderar regiao'
  return 'Manter lideranca'
}

export default function StickyCTA({ score }: StickyCTAProps) {
  const [visible, setVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const offerEl = document.getElementById('offer-heading')
    if (!offerEl) return

    // Encontrar a section pai do offer
    const offerSection = offerEl.closest('section')
    if (!offerSection) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Mostrar CTA fixo quando o bloco de oferta SAI do viewport
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0 }
    )

    observerRef.current.observe(offerSection)
    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <>
      {/* Spacer para nao cobrir conteudo */}
      {visible && <div className="h-[72px] md:hidden" />}

      <div
        className="fixed bottom-0 left-0 right-0 md:hidden"
        style={{
          zIndex: 50,
          background: 'rgba(7,26,25,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(20,184,166,0.2)',
          height: 72,
          padding: '12px 24px',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 200ms ease-out',
        }}
      >
        <div className="flex items-center justify-between gap-4 h-full max-w-[1024px] mx-auto">
          <span
            className="truncate"
            style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1 }}
          >
            Menos de R$7/dia
          </span>
          <a
            href="/api/stripe/checkout"
            className="flex-shrink-0 flex items-center justify-center font-semibold"
            style={{
              padding: '12px 24px',
              background: 'var(--accent)',
              color: '#ffffff',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              minHeight: 48,
            }}
          >
            {getCtaButtonText(score)}
          </a>
        </div>
      </div>
    </>
  )
}
