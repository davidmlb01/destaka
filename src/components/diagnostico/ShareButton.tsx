'use client'

import { useState } from 'react'

interface ShareButtonProps {
  hash: string
}

export default function ShareButton({ hash }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const url = `https://destaka.com.br/d/${hash}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="font-medium"
      style={{
        padding: '8px 16px',
        borderRadius: 10,
        background: copied ? 'var(--success-bg)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${copied ? 'var(--success-border)' : 'rgba(255,255,255,0.1)'}`,
        color: copied ? 'var(--success)' : 'var(--text-secondary)',
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all 150ms',
      }}
    >
      {copied ? 'Link copiado!' : 'Compartilhar diagnóstico'}
    </button>
  )
}
