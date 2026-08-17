'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_ok')) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem('cookie_ok', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#0d2b29',
      borderTop: '1px solid #1a3d3a',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      zIndex: 9999,
      flexWrap: 'wrap',
    }}>
      <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
        Usamos cookies essenciais para autenticação e funcionamento da plataforma.{' '}
        <Link href="/privacy" style={{ color: '#14B8A6' }}>Política de Privacidade</Link>
      </p>
      <button
        onClick={accept}
        style={{
          background: '#14B8A6',
          color: '#071a19',
          border: 'none',
          borderRadius: '8px',
          padding: '7px 20px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Entendi
      </button>
    </div>
  )
}
