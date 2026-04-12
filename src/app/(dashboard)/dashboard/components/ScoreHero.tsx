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
  fraca: 'bg-red-50 text-red-700',
  funcional: 'bg-amber-50 text-amber-700',
  forte: 'bg-green-50 text-green-700',
  perfeita: 'bg-blue-50 text-blue-700',
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
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-semibold text-slate-700">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full">
        <div className="h-1.5 bg-slate-900 rounded-full" style={{ width: `${pct}%` }} />
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
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <p className="text-sm text-slate-400">Score ainda sendo calculado. Volte em instantes.</p>
      </div>
    )
  }

  const colorClass = FAIXA_COLOR[score.faixa] ?? 'text-slate-900'
  const barClass = FAIXA_BAR[score.faixa] ?? 'bg-slate-900'
  const badgeClass = FAIXA_BG[score.faixa] ?? 'bg-slate-100 text-slate-700'
  const faixaLabel = FAIXA_LABEL[score.faixa] ?? 'Presença'

  // Delta vs yesterday (last history entry before today)
  const delta = history.length >= 2 ? score.total - history[1].total : null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Score Destaka</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-6xl font-black leading-none tracking-tight ${colorClass}`}>
              {score.total}
            </span>
            <span className="text-xl text-slate-300 font-light">/100</span>
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

      <div className="h-2 bg-slate-100 rounded-full mb-5">
        <div className={`h-2 rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${score.total}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ScoreBar label="Perfil no Google" value={score.components.gmb_completude} max={25} />
        <ScoreBar label="Reputação" value={score.components.reputacao} max={25} />
        <ScoreBar label="Visibilidade" value={score.components.visibilidade} max={20} />
        <ScoreBar label="Retenção" value={score.components.retencao} max={20} />
        <ScoreBar label="Conversão" value={score.components.conversao} max={10} />
      </div>
    </div>
  )
}
