interface ScoreData {
  total: number
  faixa: string
  snapshot_date: string
  components: {
    gmb_completude: number
    reputacao: number
    visibilidade: number
    retencao: number
    conversao: number
  }
}

interface ScoreHistory {
  total: number
  snapshot_date: string
  faixa: string
}

const FAIXA_COLOR: Record<string, string> = {
  fraca: 'text-red-500',
  funcional: 'text-amber-500',
  forte: 'text-green-500',
  perfeita: 'text-blue-500',
}

const FAIXA_BG: Record<string, string> = {
  fraca: 'bg-red-500/15 text-red-400',
  funcional: 'bg-amber-500/15 text-amber-400',
  forte: 'bg-green-500/15 text-green-400',
  perfeita: 'bg-blue-500/15 text-blue-400',
}

const FAIXA_BAR: Record<string, string> = {
  fraca: 'bg-red-500',
  funcional: 'bg-amber-500',
  forte: 'bg-green-500',
  perfeita: 'bg-blue-500',
}

const FAIXA_LABEL: Record<string, string> = {
  fraca: 'Presença Fraca',
  funcional: 'Presença Funcional',
  forte: 'Presença Forte',
  perfeita: 'Presença Perfeita',
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--border-subtle)' }}>
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
      </div>
    </div>
  )
}

export function ScoreHero({
  score,
  history,
}: {
  score: ScoreData | null
  history: ScoreHistory[]
}) {
  if (!score) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Score ainda sendo calculado. Volte em instantes.</p>
      </div>
    )
  }

  const colorClass = FAIXA_COLOR[score.faixa] ?? 'text-white'
  const barClass = FAIXA_BAR[score.faixa] ?? 'bg-white'
  const badgeClass = FAIXA_BG[score.faixa] ?? 'bg-white/10 text-white/70'
  const faixaLabel = FAIXA_LABEL[score.faixa] ?? 'Presença'

  // Delta vs yesterday (last history entry before today)
  const delta = history.length >= 2 ? score.total - history[1].total : null

  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Score Destaka</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-6xl font-black leading-none tracking-tight ${colorClass}`}>
              {score.total}
            </span>
            <span className="text-xl font-light" style={{ color: 'var(--text-muted)' }}>/100</span>
          </div>
          {delta !== null && delta !== 0 && (
            <p className={`text-xs font-semibold mt-1 ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {delta > 0 ? `+${delta}` : delta} pts vs ontem
            </p>
          )}
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${badgeClass}`}>
          {faixaLabel}
        </span>
      </div>

      <div className="h-2 rounded-full mb-5" style={{ background: 'var(--border-subtle)' }}>
        <div className={`h-2 rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${score.total}%` }} />
      </div>

      {score.components && (
        <div className="grid grid-cols-2 gap-3">
          <ScoreBar label="Perfil no Google" value={score.components.gmb_completude ?? 0} max={25} />
          <ScoreBar label="Reputação" value={score.components.reputacao ?? 0} max={25} />
          <ScoreBar label="Visibilidade" value={score.components.visibilidade ?? 0} max={20} />
          <ScoreBar label="Retenção" value={score.components.retencao ?? 0} max={20} />
          <ScoreBar label="Conversão" value={score.components.conversao ?? 0} max={10} />
        </div>
      )}
    </div>
  )
}
