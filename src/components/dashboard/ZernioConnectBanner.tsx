'use client'

import { useState } from 'react'

interface Props {
  orgId: string
}

export function ZernioConnectBanner({ orgId }: Props) {
  const [connecting, setConnecting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  async function handleConnect() {
    setConnecting(true)
    try {
      const res = await fetch('/api/zernio/connect')
      const data = await res.json() as { connected?: boolean; connectUrl?: string; accountId?: string }
      if (data.connected) {
        // Já conectado (entre sessões), recarregar para esconder banner
        window.location.reload()
      } else if (data.connectUrl) {
        window.location.href = data.connectUrl
      }
    } catch {
      setConnecting(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(14,165,233,0.08))',
        border: '1px solid rgba(20,184,166,0.2)',
      }}
    >
      <div className="flex-1">
        <h3 className="font-display font-bold text-white text-[15px] mb-1">
          Ative a publicação no Google
        </h3>
        <p className="text-[13px]" style={{ color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          Para que o Destaka publique posts e responda avaliações no seu Google Meu Negócio, autorize a conexão abaixo.
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: connecting ? 'rgba(255,255,255,0.06)' : 'var(--accent)',
            color: connecting ? 'var(--text-muted)' : '#fff',
            cursor: connecting ? 'not-allowed' : 'pointer',
          }}
        >
          {connecting ? 'Conectando...' : 'Autorizar publicação automática'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs"
          style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          Depois
        </button>
      </div>
    </div>
  )
}
