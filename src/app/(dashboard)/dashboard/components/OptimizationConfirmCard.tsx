import Link from 'next/link'

interface OptimizationConfirmCardProps {
  totalSuggestions: number
  projectedScore?: number
  currentScore?: number
}

export function OptimizationConfirmCard({
  totalSuggestions,
  projectedScore,
  currentScore,
}: OptimizationConfirmCardProps) {
  if (totalSuggestions === 0) return null

  const scoreDiff =
    projectedScore != null && currentScore != null
      ? projectedScore - currentScore
      : null

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-semibold">
            {totalSuggestions}{' '}
            {totalSuggestions === 1
              ? 'melhoria encontrada'
              : 'melhorias encontradas'}{' '}
            para subir no ranking
          </p>
          {projectedScore != null && scoreDiff != null && scoreDiff > 0 && (
            <p
              className="text-xs mt-1"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Score projetado: {projectedScore} (+{scoreDiff} pts)
            </p>
          )}
        </div>
        <Link
          href="/dashboard/optimizations"
          className="text-sm font-bold px-4 py-2 rounded-xl transition-all shrink-0"
          style={{
            background: 'rgba(20,184,166,0.15)',
            border: '1px solid rgba(20,184,166,0.25)',
            color: '#14B8A6',
          }}
        >
          Revisar melhorias
        </Link>
      </div>
    </div>
  )
}
