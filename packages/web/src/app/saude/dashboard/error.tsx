'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <span style={{ fontSize: 28 }}>!</span>
      </div>

      <h2
        className="font-display font-extrabold text-white mb-2"
        style={{ fontSize: 22 }}
      >
        Algo deu errado
      </h2>

      <p
        className="text-[15px] mb-8 max-w-md"
        style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}
      >
        Ocorreu um erro inesperado ao carregar o dashboard. Tente novamente ou volte para a tela inicial.
      </p>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: 'var(--accent-bg)',
            border: '1px solid var(--border-accent)',
            color: 'var(--accent-bright)',
          }}
        >
          Tentar novamente
        </button>
        <a
          href="/saude"
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          Voltar ao início
        </a>
      </div>
    </div>
  )
}
