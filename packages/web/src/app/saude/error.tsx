'use client'

import Link from 'next/link'

export default function SaudeError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div className="max-w-md w-full text-center">
        {/* Logo Destaka Saúde */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <svg width="32" height="43" viewBox="0 0 120 160" fill="none">
            <path
              d="M60 6C32.4 6 10 28.4 10 56C10 76 20 90 32 102C42 112 52 122 60 132C68 122 78 112 88 102C100 90 110 76 110 56C110 28.4 87.6 6 60 6Z"
              fill="var(--accent)"
            />
            <path
              d="M26 56C36 43 47 38 60 38C73 38 84 43 94 56C84 69 73 74 60 74C47 74 36 69 26 56Z"
              fill="var(--bg-base)"
            />
            <circle cx="60" cy="56" r="7" fill="var(--accent)" />
          </svg>
          <span className="font-display font-bold text-[20px] text-white tracking-[-0.5px]">
            Destaka <span style={{ color: 'var(--accent)' }}>Saúde</span>
          </span>
        </div>

        <h1
          className="font-display font-bold text-white tracking-[-1px] mb-4"
          style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}
        >
          Algo deu errado
        </h1>

        <p
          className="text-[16px] leading-relaxed mb-10"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Não se preocupe. Tente novamente ou volte para a página inicial.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl font-display font-bold text-[15px] text-white transition-all hover:brightness-110"
            style={{ background: 'var(--accent)' }}
          >
            Tentar novamente
          </button>

          <Link
            href="/saude"
            className="px-6 py-3 rounded-xl font-display font-bold text-[15px] transition-all hover:brightness-110"
            style={{
              color: 'var(--accent)',
              border: '1px solid rgba(14,165,233,0.3)',
              background: 'rgba(14,165,233,0.08)',
            }}
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
