import { useState } from 'react'
import { toast } from 'sonner'
import type { Review } from '@/lib/gmb/reviews'

interface ReplyModalState {
  review: Review
  draft: string
  generating: boolean
  publishing: boolean
}

export function useReplyModal(onSuccess: () => void) {
  const [modal, setModal] = useState<ReplyModalState | null>(null)

  function openReplyModal(review: Review) {
    setModal({ review, draft: review.reply ?? '', generating: false, publishing: false })
  }

  function closeModal() {
    setModal(null)
  }

  function setDraft(draft: string) {
    setModal((m) => (m ? { ...m, draft } : m))
  }

  async function generateReply() {
    if (!modal) return
    setModal((m) => (m ? { ...m, generating: true } : m))

    const res = await fetch('/api/reviews/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: modal.review.id }),
    })

    if (res.ok) {
      const { reply } = (await res.json()) as { reply: string }
      setModal((m) => (m ? { ...m, draft: reply, generating: false } : m))
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      setModal((m) =>
        m ? { ...m, draft: `Erro ao gerar: ${err.error ?? res.status}`, generating: false } : m,
      )
    }
  }

  async function publishReply() {
    if (!modal?.draft.trim()) return
    setModal((m) => (m ? { ...m, publishing: true } : m))

    const res = await fetch(`/api/reviews/${modal.review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: modal.draft, action: 'publish' }),
    })

    if (res.ok) {
      setModal(null)
      onSuccess()
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      toast.error(err.error ?? 'Erro ao publicar resposta. Tente novamente.')
      setModal((m) => (m ? { ...m, publishing: false } : m))
    }
  }

  async function ignoreReview(reviewId: string) {
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ignore' }),
    })
    if (res.ok) onSuccess()
  }

  return {
    modal,
    openReplyModal,
    closeModal,
    setDraft,
    generateReply,
    publishReply,
    ignoreReview,
  }
}
