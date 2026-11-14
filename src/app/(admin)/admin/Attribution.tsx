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
      className="rounded-2xl overflow-hidden admin-section-hover"
      style={{
        background: 'var(--admin-bg-card)',
        backgroundImage: 'var(--admin-gradient-card)',
        border: '1px solid var(--admin-border-card)',
        boxShadow: 'var(--admin-shadow-md)',
      }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--admin-text-heading)', fontSize: 15 }}>Attribution por canal</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>Leads e conversoes por fonte de trafego</p>
      </div>
      {channels.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>Nenhum dado de UTM capturado ainda.</p>
      ) : (
        <>
        <p className="text-[10px] px-5 py-1 md:hidden" style={{ color: 'var(--admin-text-muted)' }}>Deslize para ver mais</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(35,83,71,0.5)' }}>
                <th className="px-5 py-2.5 text-left" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Canal</th>
                <th className="px-4 py-2.5 text-right" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Leads</th>
                <th className="px-4 py-2.5 text-right" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Conversoes</th>
                <th className="px-4 py-2.5 text-right" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>Taxa</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch, i) => (
                <tr
                  key={ch.source}
                  style={i > 0 ? { borderTop: '1px solid var(--admin-border-subtle)' } : undefined}
                  className="admin-row-hover"
                >
                  <td className="px-5 py-3">
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'rgba(142,182,155,0.14)',
                        color: 'var(--admin-accent-bright)',
                        border: '1px solid rgba(142,182,155,0.25)',
                        letterSpacing: '0.03em',
                        display: 'inline-block',
                      }}
                    >
                      {ch.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--admin-text-primary)', fontSize: 13 }}>{ch.leads}</td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: 'var(--admin-text-primary)', fontSize: 13 }}>{ch.conversions}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 13,
                        color: ch.rate > 0 ? 'var(--admin-success)' : 'var(--admin-text-muted)',
                        padding: ch.rate > 0 ? '2px 8px' : undefined,
                        borderRadius: ch.rate > 0 ? 6 : undefined,
                        background: ch.rate > 0 ? 'var(--admin-success-bg)' : undefined,
                      }}
                    >
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
