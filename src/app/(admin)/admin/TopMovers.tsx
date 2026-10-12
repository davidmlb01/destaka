'use client'

interface Mover {
  name: string
  scoreBefore: number
  scoreAfter: number
  delta: number
  faixa: string
}

const FAIXA_STYLE: Record<string, { bg: string; text: string }> = {
  fraca: { bg: 'var(--error-bg)', text: 'var(--error)' },
  funcional: { bg: 'var(--warning-bg)', text: 'var(--warning)' },
  forte: { bg: 'var(--success-bg)', text: 'var(--success)' },
  perfeita: { bg: 'var(--accent-bg)', text: 'var(--accent-bright)' },
}

export function TopMovers({ movers }: { movers: Mover[] }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top movers da semana</h2>
      {movers.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>Nenhuma evolucao detectada esta semana.</p>
      ) : (
        <div className="space-y-3">
          {movers.map((m, i) => {
            const faixa = FAIXA_STYLE[m.faixa] ?? { bg: 'rgba(255,255,255,0.06)', text: 'var(--text-muted)' }
            const isPositive = m.delta > 0
            return (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: isPositive ? 'var(--success-bg)' : 'var(--error-bg)', color: isPositive ? 'var(--success)' : 'var(--error)' }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {m.scoreBefore} → {m.scoreAfter}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black" style={{ color: isPositive ? 'var(--success)' : 'var(--error)' }}>
                    {isPositive ? '+' : ''}{m.delta}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                    style={{ background: faixa.bg, color: faixa.text }}
                  >
                    {m.faixa}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
