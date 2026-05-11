'use client'

import { useEffect, useState } from 'react'
import type { Review, ReviewFilter } from '@/lib/gmb/reviews'
import { ReviewsSkeleton } from './Skeletons'
import { formatDateShort } from '@/lib/utils/format-date'
import { Spinner } from '@/components/ui/Spinner'
import { PinIcon } from '@/components/ui/PinIcon'

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
  return formatDateShort(iso)
}

const FILTER_LABELS: Record<ReviewFilter, string> = {
  all: 'Todas',
  pending: 'Sem resposta',
  negative: 'Negativas (1-2)',
  pending_approval: 'Aguardando aprovacao',
}

export function ReviewsContent() {
  const [data, setData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<ReplyModalState | null>(null)

  async function load(f = filter, p = page) {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/reviews?filter=${f}&page=${p}`)
      if (!res.ok) throw new Error('Erro ao carregar dados')
      setData(await res.json())
    } catch {
      setError('Não foi possível carregar. Tente novamente.')
    } finally {
      setLoading(false)
    }
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
      const err = await res.json().catch(() => ({})) as { error?: string }
      alert(err.error ?? 'Erro ao publicar resposta. Tente novamente.')
      setModal(m => m ? { ...m, publishing: false } : m)
    }
  }

  async function ignoreReview(reviewId: string) {
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ignore' }),
    })
    if (res.ok) load()
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[15px] mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{error}</p>
      <button onClick={() => { setError(null); load() }} className="text-[14px] font-medium px-4 py-2 rounded-lg" style={{ background: 'var(--accent)', color: '#fff' }}>
        Tentar novamente
      </button>
    </div>
  )

  return (
    <>
      {/* Badge de pendentes */}
      {data && data.pendingCount > 0 && (
        <div
          className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
        >
          <PinIcon size={18} />
          <p className="text-sm font-medium" style={{ color: 'var(--accent-bright)' }}>
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
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === f ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.06)',
              color: filter === f ? 'var(--accent-bright)' : 'rgba(255,255,255,0.5)',
              border: filter === f ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
            }}
          >
            {FILTER_LABELS[f]}
            {f === 'pending' && data && data.pendingCount > 0 && (
              <span
                className="ml-1 text-xs font-bold"
                style={{ color: 'var(--accent-bright)', fontSize: 10 }}
              >
                {data.pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <ReviewsSkeleton />
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
                  ? 'rgba(239,68,68,0.2)'
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
                      background: 'rgba(14,165,233,0.15)',
                      border: '1px solid rgba(14,165,233,0.25)',
                      color: 'var(--accent-bright)',
                    }}
                  >
                    <PinIcon size={12} color="var(--accent-bright)" bg="transparent" /> Responder
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
                    background: modal.generating ? 'rgba(255,255,255,0.06)' : 'rgba(14,165,233,0.15)',
                    color: modal.generating ? 'rgba(255,255,255,0.3)' : 'var(--accent-bright)',
                    border: '1px solid rgba(14,165,233,0.2)',
                  }}
                >
                  {modal.generating ? (
                    <>
                      <Spinner size="sm" />
                      Gerando...
                    </>
                  ) : (
                    <><PinIcon size={12} color="var(--accent-bright)" bg="transparent" /> Gerar com IA</>
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
    pending: { label: 'Aguardando', color: '#FBBF24', dot: '#FBBF24' },
    replied: { label: 'Respondida', color: 'var(--success)', dot: 'var(--success)' },
    ignored: { label: 'Ignorada', color: 'rgba(255,255,255,0.3)', dot: 'rgba(255,255,255,0.3)' },
  }[status] ?? { label: status, color: 'rgba(255,255,255,0.3)', dot: 'rgba(255,255,255,0.3)' }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium shrink-0" style={{ color: config.color }}>
      <span className="rounded-full" style={{ width: 6, height: 6, background: config.dot }} />
      {config.label}
    </span>
  )
}
