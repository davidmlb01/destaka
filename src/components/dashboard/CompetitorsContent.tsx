'use client'

import type { Competitor, BenchmarkData } from '@/lib/gmb/competitors'
import { CompetitorsSkeleton } from './Skeletons'
import { Spinner } from '@/components/ui/Spinner'
import { useCompetitors } from './hooks/useCompetitors'
import { useCompetitiveAnalysis } from './hooks/useCompetitiveAnalysis'
import { getVocab } from '@/lib/vertical-vocab'
import { ReviewVelocityChart } from './ReviewVelocityChart'

interface Profile {
  id: string
  name: string
  avg_rating: number | null
  review_count: number | null
}

function StarBar({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>sem dados</span>
  const full = Math.round(rating)
  return (
    <span style={{ color: 'var(--warning)', fontSize: 13 }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      <span className="ml-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{rating.toFixed(1)}</span>
    </span>
  )
}

function DiffLabel({ diff }: { diff: number }) {
  if (diff === 0) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>igual</span>
  const color = diff > 0 ? 'var(--success)' : 'var(--error)'
  const sign = diff > 0 ? '+' : ''
  return (
    <span className="text-xs font-medium" style={{ color }}>
      {sign}{typeof diff === 'number' && !Number.isInteger(diff) ? diff.toFixed(1) : diff} você
    </span>
  )
}

function CompetitorCard({ comp, profile, rank }: { comp: Competitor; profile: Profile; rank: number }) {
  const reviewDiff = (profile.review_count ?? 0) - comp.review_count
  const gap = comp.review_count - (profile.review_count ?? 0)

  return (
    <div
      className="rounded-2xl p-5 mb-3"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
            >
              #{rank}
            </span>
            <h3 className="font-display font-semibold text-white text-sm truncate">{comp.name}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div
          className="flex flex-col items-center gap-1 py-3 rounded-xl"
          style={{ background: 'var(--card-dark)' }}
        >
          <StarBar rating={comp.avg_rating} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>nota</p>
        </div>
        <div
          className="flex flex-col items-center gap-1 py-3 rounded-xl"
          style={{ background: 'var(--card-dark)' }}
        >
          <p className="font-display font-semibold text-white text-base leading-none">{comp.review_count}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>avaliações</p>
          {profile.review_count !== null && <DiffLabel diff={reviewDiff} />}
        </div>
      </div>

      {gap > 0 && (
        <p className="text-[12px] mt-3" style={{ color: 'var(--text-tertiary)' }}>
          {gap} avaliações à frente de você. O Destaka trabalha para fechar esse gap.
        </p>
      )}
      {gap <= 0 && (
        <p className="text-[12px] mt-3" style={{ color: '#4ADE80' }}>
          Você já está à frente neste concorrente.
        </p>
      )}
    </div>
  )
}

function InsightsSection({ specialty }: { specialty?: string | null }) {
  const vocab = getVocab(specialty)
  const { analysis, isLoading } = useCompetitiveAnalysis()

  if (isLoading) return null
  if (!analysis || !Array.isArray(analysis.gaps) || analysis.gaps.length === 0) return null

  // Máximo 3 insights, priorizados por importância
  const topGaps = analysis.gaps
    .sort((a: { priority: string }, b: { priority: string }) => {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
    })
    .slice(0, 3)

  return (
    <div className="mt-6">
      <h2 className="font-display font-semibold text-white text-base mb-1">O que o Destaka faz por você</h2>
      <p className="text-[13px] mb-4" style={{ color: 'var(--text-tertiary)' }}>
        Baseado na análise dos seus concorrentes
      </p>

      <div className="flex flex-col gap-3">
        {topGaps.map((gap: {
          type: string
          priority: 'high' | 'medium' | 'low'
          gap_description: string
          suggested_action: { label: string } | null
        }, i: number) => (
          <div
            key={i}
            className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.12)' }}
          >
            <span className="text-[14px] mt-0.5 shrink-0">
              {gap.type === 'reviews' ? '⭐' : gap.type === 'photos' ? '📸' : '📍'}
            </span>
            <div>
              <p className="text-[13px] font-medium text-white">{gap.gap_description}</p>
              {gap.suggested_action && (
                <a
                  href="/dashboard/optimizations"
                  className="text-[12px] font-bold mt-1 inline-block"
                  style={{ color: 'var(--accent-bright)' }}
                >
                  Aplicar no meu perfil →
                </a>
              )}
              {!gap.suggested_action && gap.type === 'reviews' && (
                <p className="text-[12px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Peça uma avaliação ao {vocab.cliente} no final de cada {vocab.atendimento}.
                </p>
              )}
              {!gap.suggested_action && gap.type === 'photos' && (
                <p className="text-[12px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Adicione fotos do seu espaço e equipe no Google.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {analysis.analyzed_at && (
        <p className="text-[10px] mt-4" style={{ color: 'var(--text-muted)' }}>
          Atualizado: {new Date(analysis.analyzed_at).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  )
}

export function CompetitorsContent({ specialty }: { specialty?: string | null }) {
  const {
    data,
    error,
    isLoading,
    discovering,
    msg,
    handleDiscover,
  } = useCompetitors()

  if (isLoading) {
    return <CompetitorsSkeleton />
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-[15px] mb-4" style={{ color: 'var(--text-secondary)' }}>Não foi possível carregar. Tente novamente.</p>
      <button onClick={() => window.location.reload()} className="text-[14px] font-medium px-4 py-2 rounded-lg" style={{ background: 'var(--accent)', color: '#fff' }}>
        Tentar novamente
      </button>
    </div>
  )

  // Top 3 concorrentes por review_count (os que importam)
  const top3 = (data?.competitors ?? [])
    .sort((a, b) => b.review_count - a.review_count)
    .slice(0, 3)

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display font-semibold text-white text-base mb-1">Seus 3 maiores concorrentes</h2>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Quem aparece nas mesmas buscas que você
          </p>
        </div>
        <button
          onClick={handleDiscover}
          disabled={discovering}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0"
          style={{
            background: discovering ? 'rgba(255,255,255,0.06)' : 'var(--accent-bg)',
            border: '1px solid var(--border-accent)',
            color: discovering ? 'var(--text-muted)' : 'var(--accent-bright)',
            cursor: discovering ? 'not-allowed' : 'pointer',
          }}
        >
          {discovering ? (
            <>
              <Spinner size="sm" />
              Buscando...
            </>
          ) : 'Atualizar'}
        </button>
      </div>

      {msg && (
        <div
          className="rounded-xl px-4 py-3 mb-4"
          style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--success)' }}>{msg}</p>
        </div>
      )}

      {!top3.length ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-16 gap-4"
          style={{ background: 'var(--card-dark)', border: '1px solid var(--border-card)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Nenhum concorrente mapeado ainda.
          </p>
          <button
            onClick={handleDiscover}
            disabled={discovering}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'var(--accent-bg)',
              border: '1px solid var(--border-accent)',
              color: 'var(--accent-bright)',
              cursor: discovering ? 'not-allowed' : 'pointer',
            }}
          >
            {discovering ? 'Buscando...' : 'Descobrir concorrentes'}
          </button>
        </div>
      ) : (
        <>
          {top3.map((comp, i) => (
            <CompetitorCard key={comp.id} comp={comp} profile={data!.profile} rank={i + 1} />
          ))}
          <ReviewVelocityChart />
          <InsightsSection specialty={specialty} />
        </>
      )}
    </div>
  )
}
