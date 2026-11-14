'use client'

interface Mover {
  name: string
  scoreBefore: number
  scoreAfter: number
  delta: number
  faixa: string
}

const FAIXA_STYLE: Record<string, { bg: string; text: string }> = {
  fraca:     { bg: 'var(--admin-error-bg)',    text: 'var(--admin-error)'   },
  funcional: { bg: 'var(--admin-warning-bg)',  text: 'var(--admin-warning)' },
  forte:     { bg: 'var(--admin-success-bg)',  text: 'var(--admin-success)' },
  perfeita:  { bg: 'rgba(142,182,155,0.15)',   text: 'var(--admin-accent-bright)' },
}

export function TopMovers({ movers }: { movers: Mover[] }) {
  return (
    <div
      className="rounded-2xl p-5 admin-section-hover"
      style={{
        background: 'var(--admin-bg-card)',
        backgroundImage: 'var(--admin-gradient-card)',
        border: '1px solid var(--admin-border-card)',
        boxShadow: 'var(--admin-shadow-md)',
      }}
    >
      <h2 className="font-semibold mb-1" style={{ color: 'var(--admin-text-heading)', fontSize: 15 }}>Top movers da semana</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--admin-text-muted)' }}>Maior variação de score nos últimos 7 dias</p>
      {movers.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--admin-text-muted)' }}>Nenhuma evolução detectada esta semana.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {movers.map((m, i) => {
            const faixa = FAIXA_STYLE[m.faixa] ?? { bg: 'rgba(142,182,155,0.1)', text: 'var(--admin-text-muted)' }
            const isPositive = m.delta > 0
            const pct = Math.min(Math.abs(m.delta), 20) / 20
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(5,31,32,0.4)',
                  border: '1px solid var(--admin-border-subtle)',
                  transition: 'background 150ms ease',
                }}
                className="admin-mover-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      background: isPositive ? 'var(--admin-success-bg)' : 'var(--admin-error-bg)',
                      color: isPositive ? 'var(--admin-success)' : 'var(--admin-error)',
                      border: `1px solid ${isPositive ? 'var(--admin-success-border)' : 'var(--admin-error-border)'}`,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(142,182,155,0.1)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct * 100}%`,
                          height: '100%',
                          borderRadius: 2,
                          background: isPositive ? 'var(--admin-success)' : 'var(--admin-error)',
                          transition: 'width 400ms ease',
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                        {m.scoreBefore} para {m.scoreAfter}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: isPositive ? 'var(--admin-success)' : 'var(--admin-error)' }}>
                    {isPositive ? '+' : ''}{m.delta}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 8,
                      background: faixa.bg,
                      color: faixa.text,
                      textTransform: 'capitalize',
                      border: `1px solid ${faixa.text}30`,
                      letterSpacing: '0.03em',
                    }}
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
