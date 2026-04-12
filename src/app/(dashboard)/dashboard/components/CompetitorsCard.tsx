interface Competitor {
  name: string
  avg_rating: number
  review_count: number
  last_tracked_at: string | null
}

export function CompetitorsCard({ competitors }: { competitors: Competitor[] }) {
  if (competitors.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Concorrentes próximos</h2>
      </div>

      <div className="divide-y divide-slate-50">
        {competitors.map((c, i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">{c.name}</p>
              <p className="text-xs text-slate-400">{c.review_count} avaliações</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{c.avg_rating.toFixed(1)}</p>
              <p className="text-xs text-amber-500">★ nota</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
