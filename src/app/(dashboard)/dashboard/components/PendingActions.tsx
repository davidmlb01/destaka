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
      <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
        <p className="text-green-700 font-semibold text-sm">Tudo aprovado. Nenhuma ação pendente.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Ações pendentes</h2>
        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{remaining}</span>
      </div>

      <div className="divide-y divide-slate-50">
        {activeResponses.map(r => (
          <div key={r.id} className="px-6 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Resposta de review</p>
            <p className="text-sm text-slate-700 leading-relaxed mb-3 bg-slate-50 rounded-lg px-4 py-3">
              {r.generated_text}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleResponse(r.id, 'approve')}
                className="text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Publicar
              </button>
              <button
                onClick={() => handleResponse(r.id, 'reject')}
                className="text-xs font-semibold text-slate-400 px-4 py-2 rounded-lg hover:text-slate-600 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        ))}

        {activePosts.map(p => (
          <div key={p.id} className="px-6 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Post {p.post_type}
            </p>
            <p className="text-sm text-slate-700 leading-relaxed mb-2 bg-slate-50 rounded-lg px-4 py-3">
              {p.content}
            </p>
            {p.photo_suggestion && (
              <p className="text-xs text-slate-400 mb-3">
                Foto sugerida: {p.photo_suggestion}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => handlePost(p.id, 'approve')}
                className="text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Publicar no Google
              </button>
              <button
                onClick={() => handlePost(p.id, 'reject')}
                className="text-xs font-semibold text-slate-400 px-4 py-2 rounded-lg hover:text-slate-600 transition-colors"
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
