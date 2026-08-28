interface Review {
  id: string
  rating: number
  comment: string | null
  author_name: string
  published_at: string
}

interface ReviewsData {
  total: number
  avg_rating: number
  new_this_month: number
  response_rate: number
  recent: Review[]
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function ReviewsCard({ reviews }: { reviews: ReviewsData }) {
  const responseRatePct = Math.round(reviews.response_rate * 100)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Avaliações</h2>
      </div>

      <div className="px-6 py-4 grid grid-cols-3 gap-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="text-center">
          <p className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{reviews.avg_rating.toFixed(1)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>nota média</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{reviews.new_this_month}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>este mês</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>{responseRatePct}%</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>respondidas</p>
        </div>
      </div>

      {reviews.recent.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma avaliação ainda.</p>
        </div>
      ) : (
        <div>
          {reviews.recent.slice(0, 3).map((r, i) => (
            <div key={r.id} className="px-6 py-4" style={i > 0 ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{r.author_name}</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(r.published_at)}</span>
              </div>
              {r.comment && (
                <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
