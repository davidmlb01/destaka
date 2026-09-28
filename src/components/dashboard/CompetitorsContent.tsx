'use client'

import type { Competitor, BenchmarkData } from '@/lib/gmb/competitors'
import { CompetitorsSkeleton } from './Skeletons'
import { Spinner } from '@/components/ui/Spinner'
import { useCompetitors } from './hooks/useCompetitors'
import { useCompetitiveAnalysis } from './hooks/useCompetitiveAnalysis'

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

function BenchmarkCard({ data }: { data: BenchmarkData }) {
  return (
    <div
      className="mt-3 rounded-xl px-4 py-3"
      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)' }}
    >
      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {data.summary}
      </p>

      {data.alerts.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-2">
          {data.alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs mt-0.5 shrink-0" style={{ color: 'var(--error)' }}>!</span>
              <span className="text-xs" style={{ color: '#FCA5A5' }}>{a}</span>
            </div>
          ))}
        </div>
      )}

      {data.gaps.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {data.gaps.map((g, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs mt-0.5 shrink-0" style={{ color: 'var(--success)' }}>+</span>
              <span className="text-xs" style={{ color: '#6EE7B7' }}>{g}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DiffLabel({ diff, suffix = '' }: { diff: number; suffix?: string }) {
  if (diff === 0) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>igual</span>
  const color = diff > 0 ? 'var(--success)' : 'var(--error)'
  const sign = diff > 0 ? '+' : ''
  return (
    <span className="text-xs font-medium" style={{ color }}>
      {sign}{typeof diff === 'number' && !Number.isInteger(diff) ? diff.toFixed(1) : diff}{suffix} você
    </span>
  )
}

function CompetitorCard({ comp, profile }: { comp: Competitor; profile: Profile }) {
  const ratingDiff = (profile.avg_rating ?? 0) - (comp.avg_rating ?? 0)
  const reviewDiff = (profile.review_count ?? 0) - comp.review_count

  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-white text-sm">{comp.name}</h3>
          {comp.address && (
            <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-tertiary)' }}>{comp.address}</p>
          )}
        </div>
        {comp.has_website && (
          <span
            className="text-xs px-2 py-0.5 rounded-full shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-tertiary)' }}
          >
            tem site
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-1">
        {/* Rating */}
        <div
          className="flex flex-col items-center gap-1 py-3 rounded-xl"
          style={{ background: 'var(--card-dark)' }}
        >
          <StarBar rating={comp.avg_rating} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>nota</p>
          {comp.avg_rating !== null && profile.avg_rating !== null && (
            <DiffLabel diff={ratingDiff} />
          )}
        </div>

        {/* Reviews */}
        <div
          className="flex flex-col items-center gap-1 py-3 rounded-xl"
          style={{ background: 'var(--card-dark)' }}
        >
          <p className="font-display font-bold text-white text-base leading-none">{comp.review_count}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>avaliações</p>
          {profile.review_count !== null && <DiffLabel diff={reviewDiff} />}
        </div>

        {/* Photos */}
        <div
          className="flex flex-col items-center gap-1 py-3 rounded-xl"
          style={{ background: 'var(--card-dark)' }}
        >
          <p className="font-display font-bold text-white text-base leading-none">{comp.photo_count}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>fotos</p>
        </div>
      </div>

      {comp.benchmark_data && <BenchmarkCard data={comp.benchmark_data} />}
    </div>
  )
}

const PRIORITY_CONFIG = {
  high: { label: 'ALTA', color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
  medium: { label: 'MEDIA', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
  low: { label: 'BAIXA', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
}

function OpportunitiesSection() {
  const { analysis, isLoading } = useCompetitiveAnalysis()

  if (isLoading) return null
  if (!analysis || analysis.gaps.length === 0) return null

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-display font-bold text-white text-base">Oportunidades</h2>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(168,85,247,0.15)', color: '#C084FC' }}
        >
          Baseado nos concorrentes
        </span>
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        {analysis.summary}
      </p>

      <div className="flex flex-col gap-3">
        {analysis.gaps.map((gap: {
          type: string
          priority: 'high' | 'medium' | 'low'
          gap_description: string
          missing: string[]
          suggested_action: { label: string } | null
        }, i: number) => {
          const cfg = PRIORITY_CONFIG[gap.priority]
          return (
            <div
              key={i}
              className="rounded-xl px-4 py-3"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <div className="flex items-start gap-2 mb-1.5">
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                  style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                >
                  {cfg.label}
                </span>
                <p className="text-sm font-medium text-white">{gap.gap_description}</p>
              </div>

              {gap.missing.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {gap.missing.slice(0, 5).map((item: string, j: number) => (
                    <span
                      key={j}
                      className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {gap.suggested_action && (
                <a
                  href="/dashboard/optimizations"
                  className="inline-block mt-2.5 text-xs font-bold"
                  style={{ color: 'var(--accent-bright)' }}
                >
                  Otimizar perfil →
                </a>
              )}

              {!gap.suggested_action && gap.type === 'photos' && (
                <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Adicione fotos do consultorio, equipe e procedimentos diretamente no Google.
                </p>
              )}

              {!gap.suggested_action && gap.type === 'reviews' && (
                <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Peca avaliacoes aos pacientes apos cada consulta.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {analysis.keyword_opportunities.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Termos mais buscados pelos pacientes dos concorrentes:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.keyword_opportunities.slice(0, 8).map((kw: string, i: number) => (
              <span
                key={i}
                className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(168,85,247,0.1)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.2)' }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.analyzed_at && (
        <p className="text-[10px] mt-4" style={{ color: 'var(--text-muted)' }}>
          Ultima analise: {new Date(analysis.analyzed_at).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  )
}

export function CompetitorsContent() {
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
      <p className="text-[15px] mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Não foi possível carregar. Tente novamente.</p>
      <button onClick={() => window.location.reload()} className="text-[14px] font-medium px-4 py-2 rounded-lg" style={{ background: 'var(--accent)', color: '#fff' }}>
        Tentar novamente
      </button>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display font-bold text-white text-base mb-1">Concorrentes</h2>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Top 3 concorrentes na sua especialidade e região
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

      {/* Mensagem de resultado */}
      {msg && (
        <div
          className="rounded-xl px-4 py-3 mb-4"
          style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--success)' }}>{msg}</p>
        </div>
      )}

      {/* Empty state */}
      {!data?.competitors.length ? (
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
          {data.competitors.map(comp => (
            <CompetitorCard key={comp.id} comp={comp} profile={data.profile} />
          ))}
          <OpportunitiesSection />
        </>
      )}
    </div>
  )
}
