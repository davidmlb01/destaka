interface Competitor {
  name: string
  avg_rating: number
  review_count: number
  last_tracked_at: string | null
}

export function CompetitorsCard({ competitors }: { competitors: Competitor[] }) {
  if (competitors.length === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Concorrentes proximos</h2>
      </div>

      <div>
        {competitors.map((c, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between" style={i > 0 ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{c.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.review_count} avaliacoes</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{c.avg_rating.toFixed(1)}</p>
              <p className="text-xs text-amber-400">&#9733; nota</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
