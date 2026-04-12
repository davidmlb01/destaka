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
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Avaliações</h2>
      </div>

      <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-slate-50">
        <div className="text-center">
          <p className="text-3xl font-black text-slate-900 leading-none">{reviews.avg_rating.toFixed(1)}</p>
          <p className="text-xs text-slate-400 mt-1">nota média</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black text-slate-900 leading-none">{reviews.new_this_month}</p>
          <p className="text-xs text-slate-400 mt-1">este mês</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-black text-slate-900 leading-none">{responseRatePct}%</p>
          <p className="text-xs text-slate-400 mt-1">respondidas</p>
        </div>
      </div>

      {reviews.recent.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-slate-400">Nenhuma avaliação ainda.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {reviews.recent.slice(0, 3).map(r => (
            <div key={r.id} className="px-6 py-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-xs font-semibold text-slate-700">{r.author_name}</span>
                </div>
                <span className="text-xs text-slate-400">{formatDate(r.published_at)}</span>
              </div>
              {r.comment && (
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
