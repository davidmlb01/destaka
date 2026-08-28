'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function TokenInvalidBanner() {
  const { data } = useSWR<{ gmb_token_invalid: boolean }>('/api/users/status', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 5 * 60 * 1000, // re-checa a cada 5 min
  })

  if (!data?.gmb_token_invalid) return null

  return (
    <div
      className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      style={{
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
        <div>
          <p className="font-display font-bold text-white text-sm">
            Conexão com o Google expirou
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            As automações estão pausadas até você reconectar sua conta Google.
          </p>
        </div>
      </div>
      <a
        href="/configuracoes"
        className="shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all"
        style={{
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.35)',
          color: '#FCA5A5',
        }}
      >
        Reconectar agora
      </a>
    </div>
  )
}
