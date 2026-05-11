'use client'

import { Card } from '@/components/ui/Card'
import { PostsSkeleton } from './Skeletons'
import { formatDateShort } from '@/lib/utils/format-date'
import { Spinner } from '@/components/ui/Spinner'
import { usePosts } from './hooks/usePosts'

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
  const {
    data,
    error,
    isLoading,
    generating,
    publishingId,
    deletingId,
    savingMode,
    handleGenerate,
    handlePublish,
    handleDiscard,
    handleModeChange,
  } = usePosts()

  if (isLoading) {
    return <PostsSkeleton />
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[15px] mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Não foi possível carregar. Tente novamente.</p>
      <button onClick={() => window.location.reload()} className="text-[14px] font-medium px-4 py-2 rounded-lg" style={{ background: 'var(--accent)', color: '#fff' }}>
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
                <Spinner size="md" />
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
