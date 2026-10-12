'use client'

export default function DiagnosticoError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold mb-4" style={{ color: 'var(--error)' }}>Erro</p>
        <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
          Algo deu errado no diagnostico.
        </p>
        <pre className="text-xs text-left p-4 rounded-lg mb-6 overflow-auto" style={{ background: 'var(--card-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-card)', maxHeight: 200 }}>
          {error.message}
          {error.digest ? `\nDigest: ${error.digest}` : ''}
          {error.stack ? `\n\n${error.stack}` : ''}
        </pre>
        <button
          onClick={reset}
          className="px-6 py-2 rounded-lg font-medium cursor-pointer"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
