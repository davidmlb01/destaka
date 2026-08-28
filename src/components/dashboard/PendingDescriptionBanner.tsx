'use client'

import { useState } from 'react'
import useSWR from 'swr'

interface PendingDescription {
  text: string
  createdAt: string
  profileId: string
  profileName: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function PendingDescriptionBanner() {
  const { data, mutate } = useSWR<{ pending: PendingDescription | null }>('/api/gmb/description', fetcher)
  const [editedText, setEditedText] = useState<string | null>(null)
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!data?.pending) return null

  const { text, profileId } = data.pending
  const displayText = editedText ?? text

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(action)
    setFeedback(null)
    try {
      const res = await fetch('/api/gmb/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action, text: action === 'approve' ? displayText : undefined }),
      })
      const json = await res.json()
      if (!res.ok) { setFeedback(json.error ?? 'Erro ao processar'); return }

      if (action === 'approve') {
        setFeedback(json.appliedToGbp
          ? 'Descrição publicada no Google Meu Negócio.'
          : 'Descrição aprovada. Será publicada assim que a conexão com o Google for reestabelecida.')
      }
      // Remove o banner após ação bem-sucedida
      setTimeout(() => mutate({ pending: null }), 2000)
    } catch {
      setFeedback('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 animate-fade-in-up"
      style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold" style={{ color: '#34D399' }}>
            Descrição pronta para aprovação
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Gerada com base nas informações do seu perfil. Edite se necessário e aprove para publicar no Google.
          </p>
        </div>
      </div>

      <textarea
        value={displayText}
        onChange={e => setEditedText(e.target.value)}
        rows={4}
        maxLength={750}
        className="w-full rounded-xl p-4 text-sm resize-none outline-none focus:ring-1"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: '1.6',
        }}
      />

      <p className="text-xs text-right" style={{ color: 'rgba(255,255,255,0.45)', marginTop: -8 }}>
        {displayText.length}/750
      </p>

      {feedback && (
        <p className="text-sm font-medium" style={{ color: '#34D399' }}>{feedback}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleAction('approve')}
          disabled={!!loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: '#059669', color: '#fff' }}
        >
          {loading === 'approve' ? 'Publicando...' : 'Aprovar e publicar'}
        </button>
        <button
          onClick={() => handleAction('reject')}
          disabled={!!loading}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
        >
          {loading === 'reject' ? 'Removendo...' : 'Rejeitar'}
        </button>
      </div>
    </div>
  )
}
