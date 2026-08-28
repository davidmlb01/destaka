'use client'

import { useState } from 'react'

interface PendingResponse {
  id: string
  generated_text: string
  review_id: string
}

interface PendingPost {
  id: string
  content: string
  post_type: string
  photo_suggestion: string
}

export function PendingActions({
  responses,
  posts,
}: {
  responses: PendingResponse[]
  posts: PendingPost[]
}) {
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  const total = responses.length + posts.length
  if (total === 0) return null

  async function handleResponse(id: string, action: 'approve' | 'reject') {
    const method = action === 'approve' ? 'POST' : 'DELETE'
    await fetch('/api/reviews/approve', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_id: id }),
    })
    setDoneIds(prev => new Set([...prev, id]))
  }

  async function handlePost(id: string, action: 'approve' | 'reject') {
    const method = action === 'approve' ? 'POST' : 'DELETE'
    await fetch('/api/posts/approve', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: id }),
    })
    setDoneIds(prev => new Set([...prev, id]))
  }

  const activeResponses = responses.filter(r => !doneIds.has(r.id))
  const activePosts = posts.filter(p => !doneIds.has(p.id))
  const remaining = activeResponses.length + activePosts.length

  if (remaining === 0) {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
        <p className="text-green-400 font-semibold text-sm">Tudo aprovado. Nenhuma acao pendente.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Acoes pendentes</h2>
        <span className="bg-amber-500/15 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">{remaining}</span>
      </div>

      <div>
        {activeResponses.map((r, i) => (
          <div key={r.id} className="px-6 py-4" style={i > 0 || false ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Resposta de review</p>
            <p className="text-sm leading-relaxed mb-3 rounded-lg px-4 py-3" style={{ color: 'var(--text-secondary)', background: 'var(--card-dark)' }}>
              {r.generated_text}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleResponse(r.id, 'approve')}
                className="text-xs font-semibold text-white px-4 py-2 rounded-lg transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                Publicar
              </button>
              <button
                onClick={() => handleResponse(r.id, 'reject')}
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Descartar
              </button>
            </div>
          </div>
        ))}

        {activePosts.map((p, i) => (
          <div key={p.id} className="px-6 py-4" style={(i > 0 || activeResponses.length > 0) ? { borderTop: '1px solid var(--border-subtle)' } : undefined}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Post {p.post_type}
            </p>
            <p className="text-sm leading-relaxed mb-2 rounded-lg px-4 py-3" style={{ color: 'var(--text-secondary)', background: 'var(--card-dark)' }}>
              {p.content}
            </p>
            {p.photo_suggestion && (
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Foto sugerida: {p.photo_suggestion}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => handlePost(p.id, 'approve')}
                className="text-xs font-semibold text-white px-4 py-2 rounded-lg transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                Publicar no Google
              </button>
              <button
                onClick={() => handlePost(p.id, 'reject')}
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Descartar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
