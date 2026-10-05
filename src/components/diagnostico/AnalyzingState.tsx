'use client'

interface AnalyzingStateProps {
  profileName: string
}

export default function AnalyzingState({ profileName }: AnalyzingStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center max-w-md">
        {/* Ícone pulsante */}
        <div className="flex justify-center mb-6">
          <div
            className="flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              animation: 'pulse-icon 2s ease-in-out infinite',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <h1
          className="font-display font-bold mb-3"
          style={{ fontSize: 24, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.5px' }}
        >
          Analisando {profileName}
        </h1>

        <p className="mb-6" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Estamos coletando dados do seu perfil no Google. Isso leva alguns minutos.
        </p>

        {/* Barra indeterminada */}
        <div className="w-full mb-6" style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div
            style={{
              width: '40%',
              height: '100%',
              borderRadius: 2,
              background: 'var(--accent)',
              animation: 'shimmer-bar 1.5s ease-in-out infinite',
            }}
          />
        </div>

        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Analisando...
        </p>

        <p className="mt-4" style={{ fontSize: 14, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Você receberá um email quando o diagnóstico estiver pronto. Pode fechar esta página.
        </p>

        <style>{`
          @keyframes pulse-icon {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          @keyframes shimmer-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .pulse-icon, .shimmer-bar { animation: none !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
