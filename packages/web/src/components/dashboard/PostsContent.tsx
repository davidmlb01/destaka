'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { apiFetch } from '@/lib/api/client'
import { PostsSkeleton } from './Skeletons'
import { formatDateShort } from '@/lib/utils/format-date'

interface Post {
  id: string
  content: string
  type: string
  status: 'draft' | 'published' | 'scheduled' | 'failed'
  scheduled_for: string | null
  published_at: string | null
  created_at: string
}

interface PostsData {
  posts: Post[]
  total: number
  page: number
  pageSize: number
  scheduledNext: Post | null
  autoPostMode: 'automatic' | 'approval'
  profile: { id: string; name: string; category: string }
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Aguardando aprovação', color: '#FBBF24' },
  published: { label: 'Publicado', color: '#4ADE80' },
  scheduled: { label: 'Agendado', color: 'var(--accent-bright)' },
  failed: { label: 'Falhou', color: 'var(--error)' },
}

const TYPE_LABELS: Record<string, string> = {
  update: 'Novidade',
  event: 'Evento',
  offer: 'Oferta',
}

function formatDate(iso: string) {
  return formatDateShort(iso)
}

export function PostsContent() {
  const [data, setData] = useState<PostsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingMode, setSavingMode] = useState(false)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const { data: result, error: fetchError } = await apiFetch<PostsData>('/api/posts')
      if (fetchError || !result) throw new Error(fetchError ?? 'Erro ao carregar dados')
      setData(result)
    } catch {
      setError('Não foi possível carregar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const { error } = await apiFetch('/api/posts/generate', { method: 'POST' })
      if (error) {
        alert(error)
        return
      }
      await load()
    } finally {
      setGenerating(false)
    }
  }

  async function handlePublish(postId: string) {
    setPublishingId(postId)
    try {
      const { error } = await apiFetch(`/api/posts/${postId}/publish`, { method: 'POST' })
      if (error) {
        alert(error)
        return
      }
      await load()
    } finally {
      setPublishingId(null)
    }
  }

  async function handleDiscard(postId: string) {
    setDeletingId(postId)
    try {
      const { error } = await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (error) {
        alert(error)
        return
      }
      await load()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleModeChange(mode: 'automatic' | 'approval') {
    if (!data || mode === data.autoPostMode) return
    setSavingMode(true)
    try {
      const res = await fetch('/api/posts/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPostMode: mode }),
      })
      if (res.ok) {
        setData(d => d ? { ...d, autoPostMode: mode } : d)
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string }
        alert(err.error ?? 'Erro ao salvar configuração.')
      }
    } finally {
      setSavingMode(false)
    }
  }

  if (loading) {
    return <PostsSkeleton />
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[15px] mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{error}</p>
      <button onClick={() => { setError(null); load() }} className="text-[14px] font-medium px-4 py-2 rounded-lg" style={{ background: 'var(--accent)', color: '#fff' }}>
        Tentar novamente
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      {/* Configurações + botão gerar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Modo de postagem */}
        <Card variant="dark" padding="sm">
          <p className="font-display font-bold text-white text-sm mb-1">Modo de postagem</p>
          <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Como os posts semanais serão tratados
          </p>
          <div className="flex gap-2">
            {(['approval', 'automatic'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                disabled={savingMode}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: data?.autoPostMode === mode ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.05)',
                  border: data?.autoPostMode === mode ? '1px solid rgba(14,165,233,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color: data?.autoPostMode === mode ? 'var(--accent-bright)' : 'rgba(255,255,255,0.4)',
                }}
              >
                {mode === 'approval' ? '✋ Aprovação' : '⚡ Automático'}
              </button>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {data?.autoPostMode === 'automatic'
              ? 'Posts são publicados direto toda semana, sem precisar revisar.'
              : 'Você recebe o post para revisar antes de publicar.'}
          </p>
        </Card>

        {/* Próximo post + botão gerar */}
        <Card variant="dark" padding="sm" className="flex flex-col justify-between">
          {data?.scheduledNext ? (
            <div className="mb-3">
              <p className="font-display font-bold text-white text-sm mb-1">Próximo post agendado</p>
              <p className="text-xs line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {data.scheduledNext.content}
              </p>
              {data.scheduledNext.scheduled_for && (
                <p className="text-xs mt-1" style={{ color: 'var(--accent-bright)' }}>
                  Agendado para {formatDate(data.scheduledNext.scheduled_for)}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-3">
              <p className="font-display font-bold text-white text-sm mb-1">Nenhum post agendado</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Gere um post agora ou aguarde o agendamento semanal.
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all"
            style={{
              background: generating ? 'rgba(255,255,255,0.06)' : 'rgba(14,165,233,0.2)',
              border: '1px solid rgba(14,165,233,0.3)',
              color: generating ? 'rgba(255,255,255,0.3)' : 'var(--accent-bright)',
            }}
          >
            {generating ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'rgba(252,211,77,0.3)', borderTopColor: 'var(--accent-bright)' }} />
                Gerando post...
              </>
            ) : (
              <>✨ Gerar Post Agora</>
            )}
          </button>
        </Card>
      </div>

      {/* Posts aguardando aprovação */}
      {data?.posts.some(p => p.status === 'draft') && (
        <div>
          <p className="font-display font-bold text-white text-sm mb-3" style={{ opacity: 0.7 }}>
            Aguardando aprovação
          </p>
          <div className="flex flex-col gap-3">
            {data.posts.filter(p => p.status === 'draft').map(post => (
              <div
                key={post.id}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}
                  >
                    {TYPE_LABELS[post.type] ?? post.type}
                  </span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {formatDate(post.created_at)}
                  </span>
                </div>
                <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                  {post.content}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePublish(post.id)}
                    disabled={publishingId === post.id}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{
                      background: 'rgba(74,222,128,0.15)',
                      border: '1px solid rgba(74,222,128,0.25)',
                      color: publishingId === post.id ? 'rgba(74,222,128,0.4)' : '#4ADE80',
                    }}
                  >
                    {publishingId === post.id ? 'Publicando...' : '✓ Publicar'}
                  </button>
                  <button
                    onClick={() => handleDiscard(post.id)}
                    disabled={deletingId === post.id}
                    className="px-4 py-2 rounded-xl text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      <div>
        <p className="font-display font-bold text-white text-sm mb-3" style={{ opacity: 0.7 }}>
          Histórico de posts
        </p>

        {!data?.posts.filter(p => p.status !== 'draft').length ? (
          <div
            className="rounded-2xl flex items-center justify-center py-12"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Nenhum post publicado ainda. Gere seu primeiro post acima.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data?.posts.filter(p => p.status !== 'draft').map(post => {
              const cfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.draft
              return (
                <Card key={post.id} variant="dark" padding="sm">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
                      >
                        {TYPE_LABELS[post.type] ?? post.type}
                      </span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {formatDate(post.published_at ?? post.created_at)}
                      </span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                    {post.content}
                  </p>
                </Card>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
