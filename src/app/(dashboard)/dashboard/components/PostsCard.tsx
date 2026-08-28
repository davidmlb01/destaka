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
  published: 'bg-green-500/15 text-green-400',
  pending: 'bg-amber-500/15 text-amber-400',
  rejected: 'bg-white/5 text-white/35',
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
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Conteudo recente</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum post gerado ainda.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Conteudo recente</h2>
      </div>

      <div>
        {posts.slice(0, 5).map((p, i) => (
          <div key={p.id} className="px-6 py-4" style={i > 0 ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {TYPE_LABEL[p.post_type] ?? p.post_type}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[p.status] ?? 'bg-white/5 text-white/35'}`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>
              {p.published_at && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(p.published_at)}</span>
              )}
            </div>
            <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
