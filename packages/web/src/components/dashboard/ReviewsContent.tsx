'use client'

import { useEffect, useState } from 'react'
import type { Review, ReviewFilter } from '@/lib/gmb/reviews'

interface ReviewsData {
  reviews: Review[]
  total: number
  pendingCount: number
  page: number
  pageSize: number
  profile: { id: string; name: string; category: string }
}

interface ReplyModalState {
  review: Review
  draft: string
  generating: boolean
  publishing: boolean
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#FBBF24', fontSize: 13, letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const FILTER_LABELS: Record<ReviewFilter, string> = {
  all: 'Todas',
  pending: 'Sem resposta',
  negative: 'Negativas (1-2)',
}

export function ReviewsContent() {
  const [data, setData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<ReplyModalState | null>(null)

  async function load(f = filter, p = page) {
    setLoading(true)
    const res = await fetch(`/api/reviews?filter=${f}&page=${p}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function changeFilter(f: ReviewFilter) {
    setFilter(f)
    setPage(1)
    load(f, 1)
  }

  function changePage(p: number) {
    setPage(p)
    load(filter, p)
  }

  async function openReplyModal(review: Review) {
    setModal({ review, draft: review.reply ?? '', generating: false, publishing: false })
  }

  async function generateReply() {
    if (!modal) return
    setModal(m => m ? { ...m, generating: true } : m)

    const res = await fetch('/api/reviews/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: modal.review.id }),
    })

    if (res.ok) {
      const { reply } = await res.json() as { reply: string }
      setModal(m => m ? { ...m, draft: reply, generating: false } : m)
    } else {
      const err = await res.json().catch(() => ({})) as { error?: string }
      setModal(m => m ? { ...m, draft: `Erro ao gerar: ${err.error ?? res.status}`, generating: false } : m)
    }
  }

  async function publishReply() {
    if (!modal?.draft.trim()) return
    setModal(m => m ? { ...m, publishing: true } : m)

    const res = await fetch(`/api/reviews/${modal.review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: modal.draft, action: 'publish' }),
    })

    if (res.ok) {
      setModal(null)
      load()
    } else {
      setModal(m => m ? { ...m, publishing: false } : m)
    }
  }

  async function ignoreReview(reviewId: string) {
    await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ignore' }),
    })
    load()
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1

  return (
    <>
      {/* Badge de pendentes */}
      {data && data.pendingCount > 0 && (
        <div
          className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
        >
          <span style={{ fontSize: 18 }}>⭐</span>
          <p className="text-sm font-medium" style={{ color: '#FCD34D' }}>
            {data.pendingCount} {data.pendingCount === 1 ? 'avaliação aguardando' : 'avaliações aguardando'} resposta. Responder rápido melhora seu ranking.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(Object.keys(FILTER_LABELS) as ReviewFilter[]).map(f => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === f ? 'rgba(217,119,6,0.2)' : 'rgba(255,255,255,0.06)',
              color: filter === f ? '#FCD34D' : 'rgba(255,255,255,0.5)',
              border: filter === f ? '1px solid rgba(217,119,6,0.3)' : '1px solid transparent',
            }}
          >
            {FILTER_LABELS[f]}
            {f === 'pending' && data && data.pendingCount > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                style={{ background: '#D97706', color: 'white', fontSize: 10 }}
              >
                {data.pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl animate-pulse"
              style={{ height: 110, background: 'rgba(255,255,255,0.04)' }}
            />
          ))}
        </div>
      ) : !data?.reviews.length ? (
        <div
          className="rounded-2xl flex items-center justify-center py-16"
          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Nenhuma avaliação encontrada para este filtro.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.reviews.map(review => (
            <div
              key={review.id}
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: `1px solid ${review.reply_status === 'pending' && review.rating <= 2
                  ? 'rgba(251,146,60,0.2)'
                  : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-white">{review.author}</span>
                    <StarRow rating={review.rating} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(review.review_date)}
                  </p>
                </div>
                <StatusBadge status={review.reply_status} />
              </div>

              {/* Texto da avaliação */}
              {review.text && (
                <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                  "{review.text}"
                </p>
              )}

              {/* Resposta publicada */}
              {review.reply && (
                <div
                  className="rounded-xl px-4 py-3 mb-3"
                  style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.12)' }}
                >
                  <p className="text-xs mb-1 font-medium" style={{ color: '#4ADE80' }}>Sua resposta</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                    {review.reply}
                  </p>
                </div>
              )}

              {/* Ações */}
              {review.reply_status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openReplyModal(review)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: 'rgba(217,119,6,0.15)',
                      border: '1px solid rgba(217,119,6,0.25)',
                      color: '#FCD34D',
                    }}
                  >
                    ✍️ Responder
                  </button>
                  <button
                    onClick={() => ignoreReview(review.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}
                  >
                    Ignorar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: page === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
            }}
          >
            ← Anterior
          </button>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => changePage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: page === totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
            }}
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Modal de resposta */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6"
            style={{ background: 'var(--modal-bg)', border: '1px solid var(--border-card)' }}
          >
            {/* Header modal */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="font-display font-bold text-white mb-0.5">{modal.review.author}</p>
                <div className="flex items-center gap-2">
                  <StarRow rating={modal.review.rating} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(modal.review.review_date)}
                  </span>
                </div>
              </div>
              <button
            onClick={() => setModal(null)}
            className="transition-colors"
            style={{ color: 'var(--text-tertiary)', fontSize: 18 }}
            aria-label="Fechar"
          >✕</button>
            </div>

            {/* Texto da avaliação */}
            {modal.review.text && (
              <div
                className="rounded-xl px-4 py-3 mb-4"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                  "{modal.review.text}"
                </p>
              </div>
            )}

            {/* Editor de resposta */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Sua resposta
                </label>
                <button
                  onClick={generateReply}
                  disabled={modal.generating}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: modal.generating ? 'rgba(255,255,255,0.06)' : 'rgba(217,119,6,0.15)',
                    color: modal.generating ? 'rgba(255,255,255,0.3)' : '#FCD34D',
                    border: '1px solid rgba(217,119,6,0.2)',
                  }}
                >
                  {modal.generating ? (
                    <>
                      <span className="inline-block w-3 h-3 rounded-full border border-t-transparent animate-spin"
                        style={{ borderColor: 'rgba(252,211,77,0.3)', borderTopColor: '#FCD34D' }} />
                      Gerando...
                    </>
                  ) : (
                    <>✨ Gerar com IA</>
                  )}
                </button>
              </div>
              <textarea
                value={modal.draft}
                onChange={e => setModal(m => m ? { ...m, draft: e.target.value } : m)}
                rows={4}
                maxLength={4096}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  outline: 'none',
                }}
                placeholder="Escreva sua resposta ou clique em 'Gerar com IA'..."
              />
              <p className="text-xs mt-1 text-right" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {modal.draft.length}/4096
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
              >
                Cancelar
              </button>
              <button
                onClick={publishReply}
                disabled={!modal.draft.trim() || modal.publishing}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                style={{
                  background: modal.draft.trim() && !modal.publishing
                    ? 'rgba(74,222,128,0.15)'
                    : 'rgba(255,255,255,0.05)',
                  border: modal.draft.trim() && !modal.publishing
                    ? '1px solid rgba(74,222,128,0.25)'
                    : '1px solid transparent',
                  color: modal.draft.trim() && !modal.publishing ? '#4ADE80' : 'rgba(255,255,255,0.2)',
                }}
              >
                {modal.publishing ? 'Publicando...' : 'Publicar Resposta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: 'Aguardando', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
    replied: { label: 'Respondida', color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
    ignored: { label: 'Ignorada', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' },
  }[status] ?? { label: status, color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' }

  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}
