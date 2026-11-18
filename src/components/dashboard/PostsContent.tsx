'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { PostsSkeleton } from './Skeletons'
import { formatDateShort } from '@/lib/utils/format-date'
import { Spinner } from '@/components/ui/Spinner'
import { usePosts } from './hooks/usePosts'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Aguardando aprovação', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  pending: { label: 'Aguardando aprovação', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  published: { label: 'Publicado', color: '#4ADE80', bg: 'rgba(74,222,128,0.1)' },
  scheduled: { label: 'Agendado', color: 'var(--accent-bright)', bg: 'rgba(14,165,233,0.1)' },
  failed: { label: 'Falhou', color: 'var(--error)', bg: 'rgba(239,68,68,0.1)' },
}

const TYPE_LABELS: Record<string, string> = {
  update: 'Novidade',
  event: 'Evento',
  offer: 'Oferta',
  educativo: 'Educativo',
  bairro: 'Local',
}

function formatDate(iso: string) {
  return formatDateShort(iso)
}

function getNextAutoPostLabel(): string {
  const now = new Date()
  const todayCron = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10, 15))
  const target = now < todayCron ? todayCron : new Date(todayCron.getTime() + 24 * 60 * 60 * 1000)
  const brt = new Date(target.getTime() - 3 * 60 * 60 * 1000)
  const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
  const day = weekdays[brt.getUTCDay()]
  const dd = String(brt.getUTCDate()).padStart(2, '0')
  const mm = String(brt.getUTCMonth() + 1).padStart(2, '0')
  return `${day} (${dd}/${mm}) às 07:15`
}

export function PostsContent() {
  const {
    data,
    error,
    isLoading,
    generating,
    publishingId,
    deletingId,
    savingMode,
    justPublishedId,
    handleGenerate,
    handlePublish,
    handleDiscard,
    handleModeChange,
  } = usePosts()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  if (isLoading) return <PostsSkeleton />

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[15px] mb-4" style={{ color: 'var(--text-secondary)' }}>Não foi possível carregar. Tente novamente.</p>
      <button
        onClick={() => window.location.reload()}
        className="text-[14px] font-medium px-4 py-2 rounded-lg"
        style={{ background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}
      >
        Tentar novamente
      </button>
    </div>
  )

  const pendingPosts = data?.posts.filter(p => p.status === 'draft' || p.status === 'pending') ?? []
  const publishedPosts = data?.posts.filter(p => p.status !== 'draft' && p.status !== 'pending') ?? []

  return (
    <div className="flex flex-col gap-6">

      {/* Configuracoes + botao gerar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Modo de postagem */}
        <Card variant="dark" padding="sm">
          <p className="font-display font-semibold text-white text-sm mb-1">Modo de postagem</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
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
                  cursor: savingMode ? 'wait' : 'pointer',
                  background: data?.autoPostMode === mode ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.05)',
                  border: data?.autoPostMode === mode ? '1px solid rgba(14,165,233,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  color: data?.autoPostMode === mode ? 'var(--accent-bright)' : 'rgba(255,255,255,0.4)',
                }}
              >
                {mode === 'approval' ? 'Aprovação' : 'Automático'}
              </button>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            {data?.autoPostMode === 'automatic'
              ? 'Posts são publicados direto toda semana, sem precisar revisar.'
              : 'Você recebe o post para revisar antes de publicar.'}
          </p>
        </Card>

        {/* Proximo post + botao gerar */}
        <Card variant="dark" padding="sm" className="flex flex-col justify-between">
          {data?.scheduledNext ? (
            <div className="mb-3">
              <p className="font-display font-semibold text-white text-sm mb-1">Próximo post agendado</p>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                {data.scheduledNext.content}
              </p>
              {data.scheduledNext.scheduled_at && (
                <p className="text-xs mt-1" style={{ color: 'var(--accent-bright)' }}>
                  Agendado para {formatDate(data.scheduledNext.scheduled_at)}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-3">
              <p className="font-display font-semibold text-white text-sm mb-1">Nenhum post agendado</p>
              {data?.autoPostMode === 'automatic' ? (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Próximo post automático: <span style={{ color: 'var(--accent-bright)' }}>{getNextAutoPostLabel()}</span>
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Gere um post agora ou aguarde o agendamento semanal.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all"
            style={{
              cursor: generating ? 'wait' : 'pointer',
              background: generating ? 'rgba(255,255,255,0.06)' : 'rgba(14,165,233,0.2)',
              border: '1px solid rgba(14,165,233,0.3)',
              color: generating ? 'rgba(255,255,255,0.3)' : 'var(--accent-bright)',
            }}
          >
            {generating ? (
              <>
                <Spinner size="md" />
                Gerando post...
              </>
            ) : (
              <>Gerar post agora</>
            )}
          </button>
        </Card>
      </div>

      {/* ─── Secao: Posts pendentes ─── */}
      {pendingPosts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: '#FBBF24' }} />
            <p className="font-display font-semibold text-white text-sm">
              Aguardando aprovação
            </p>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}
            >
              {pendingPosts.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {pendingPosts.map(post => {
              const isPublishing = publishingId === post.id
              const isDeleting = deletingId === post.id
              const isBusy = isPublishing || isDeleting

              return (
                <div
                  key={post.id}
                  className="rounded-2xl p-5 transition-all duration-300"
                  style={{
                    background: isPublishing ? 'rgba(74,222,128,0.08)' : 'rgba(251,191,36,0.06)',
                    border: isPublishing ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(251,191,36,0.2)',
                    opacity: isBusy ? 0.7 : 1,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(251,191,36,0.15)', color: '#FBBF24' }}
                    >
                      {TYPE_LABELS[post.type] ?? post.type}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  {editingId === post.id ? (
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="w-full text-sm mb-3 p-3 rounded-xl resize-none"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-primary)',
                        lineHeight: 1.6,
                        minHeight: 120,
                      }}
                    />
                  ) : (
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {post.content}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const text = editingId === post.id ? editText : post.content
                        handlePublish(post.id, text)
                        setEditingId(null)
                      }}
                      disabled={isBusy}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                      style={{
                        cursor: isBusy ? 'wait' : 'pointer',
                        background: isPublishing ? 'rgba(74,222,128,0.3)' : 'rgba(74,222,128,0.15)',
                        border: '1px solid rgba(74,222,128,0.25)',
                        color: isPublishing ? '#fff' : '#4ADE80',
                      }}
                    >
                      {isPublishing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Spinner size="sm" />
                          Publicando...
                        </span>
                      ) : 'Publicar no Google'}
                    </button>
                    {editingId === post.id ? (
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.97]"
                        style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'var(--text-tertiary)' }}
                      >
                        Cancelar
                      </button>
                    ) : (
                      <button
                        onClick={() => { setEditingId(post.id); setEditText(post.content) }}
                        disabled={isBusy}
                        className="px-4 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.97]"
                        style={{ cursor: isBusy ? 'default' : 'pointer', background: 'rgba(255,255,255,0.05)', color: 'var(--text-tertiary)' }}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => handleDiscard(post.id)}
                      disabled={isBusy}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.97]"
                      style={{ cursor: isBusy ? 'wait' : 'pointer', background: 'rgba(255,255,255,0.05)', color: isDeleting ? 'var(--error)' : 'var(--text-tertiary)' }}
                    >
                      {isDeleting ? 'Removendo...' : 'Descartar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Divisor visual ─── */}
      {pendingPosts.length > 0 && publishedPosts.length > 0 && (
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
      )}

      {/* ─── Secao: Historico de posts ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background: '#4ADE80' }} />
          <p className="font-display font-semibold text-white text-sm">
            Publicados
          </p>
          {publishedPosts.length > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80' }}
            >
              {publishedPosts.length}
            </span>
          )}
        </div>

        {publishedPosts.length === 0 ? (
          <div
            className="rounded-2xl flex items-center justify-center py-12"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Nenhum post publicado ainda. Aprove um post acima ou gere um novo.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {publishedPosts.map(post => {
              const cfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.published
              const isJustPublished = justPublishedId === post.id

              return (
                <Card
                  key={post.id}
                  variant="dark"
                  padding="sm"
                  style={isJustPublished ? {
                    border: '1px solid rgba(74,222,128,0.3)',
                    background: 'rgba(74,222,128,0.06)',
                    transition: 'all 300ms ease',
                  } : undefined}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {TYPE_LABELS[post.type] ?? post.type}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(post.published_at ?? post.created_at)}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: cfg.color }}>
                      {isJustPublished && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
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
