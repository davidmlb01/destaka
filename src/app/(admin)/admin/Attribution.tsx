'use client'

interface ChannelRow {
  source: string
  leads: number
  conversions: number
  rate: number
}

export function Attribution({ channels }: { channels: ChannelRow[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Attribution por canal</h2>
      </div>
      {channels.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Nenhum dado de UTM capturado ainda.</p>
      ) : (
        <>
        <p className="text-[10px] px-5 py-1 md:hidden" style={{ color: 'var(--text-muted)' }}>← Deslize para ver mais →</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th className="px-5 py-2.5 text-left text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Canal</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Leads</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Conversoes</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>Taxa</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch, i) => (
                <tr key={ch.source} style={i > 0 ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
                  <td className="px-5 py-2.5">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent-bright)', border: '1px solid var(--accent-border)' }}
                    >
                      {ch.source}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{ch.leads}</td>
                  <td className="px-4 py-2.5 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{ch.conversions}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="font-bold" style={{ color: ch.rate > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                      {ch.rate > 0 ? `${ch.rate}%` : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}
