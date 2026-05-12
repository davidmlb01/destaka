'use client'

import { useState, useEffect } from 'react'

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      const scrollPercent =
        window.scrollY / (document.body.scrollHeight - window.innerHeight)
      setVisible(scrollPercent > 0.3)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 py-3"
      style={{
        background: '#0F2A1F',
        borderTop: '1px solid rgba(74, 222, 128, 0.2)',
      }}
    >
      <a
        href="/saude/verificar"
        className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg font-display font-bold text-sm transition-all hover:brightness-110"
        style={{ background: '#4ade80', color: '#0F2A1F' }}
      >
        Diagnóstico gratuito
      </a>
    </div>
  )
}
