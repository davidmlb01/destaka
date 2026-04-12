interface Post {
  id: string
  content: string
  post_type: string
  published_at: string | null
  status: string
}

const TYPE_LABEL: Record<string, string> = {
  educativo: 'Educativo',
  procedimento: 'Procedimento',
  bairro: 'Bairro',
  review_highlight: 'Avaliação',
  equipe: 'Equipe',
}

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  rejected: 'bg-slate-100 text-slate-400',
}

const STATUS_LABEL: Record<string, string> = {
  published: 'publicado',
  pending: 'pendente',
  rejected: 'descartado',
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function PostsCard({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Conteúdo recente</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-slate-400">Nenhum post gerado ainda.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Conteúdo recente</h2>
      </div>

      <div className="divide-y divide-slate-50">
        {posts.slice(0, 5).map(p => (
          <div key={p.id} className="px-6 py-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {TYPE_LABEL[p.post_type] ?? p.post_type}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[p.status] ?? 'bg-slate-100 text-slate-400'}`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>
              {p.published_at && (
                <span className="text-xs text-slate-400">{formatDate(p.published_at)}</span>
              )}
            </div>
            <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">{p.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
