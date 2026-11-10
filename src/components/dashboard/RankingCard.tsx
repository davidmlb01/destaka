'use client'

import { useEffect, useState } from 'react'
import { RankingChart } from './RankingChart'

interface RankingKeyword {
  keyword: string
  isPrimary: boolean
  currentPosition: number | null
  previousPosition: number | null
  delta: number | null
  topCompetitor: string | null
  topCompetitorReviews: number | null
  history: Array<{ position: number | null; date: string }>
}

interface RankingData {
  primary: RankingKeyword | null
  keywords: RankingKeyword[]
  lastTracked: string | null
  empty?: boolean
}

function PositionBadge({ position }: { position: number | null }) {
  if (position === null) return (
    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
      Fora do top 20
    </span>
  )

  const colors: Record<number, { bg: string; text: string }> = {
    1: { bg: 'rgba(52,211,153,0.15)', text: '#34d399' },
    2: { bg: 'rgba(14,165,233,0.15)', text: '#0ea5e9' },
    3: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  }
  const style = colors[position] ?? { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.5)' }

  return (
    <span
      className="font-display font-extrabold"
      style={{ fontSize: 36, lineHeight: 1, color: style.text, letterSpacing: '-1px' }}
    >
      {position}o
    </span>
  )
}

function DeltaIndicator({ delta }: { delta: number | null }) {
  if (delta === null) return null
  if (delta === 0) return <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>estável</span>

  // Delta positivo = subiu posições (ex: de 5 para 2 = +3 subiu)
  // Delta negativo = caiu posições (ex: de 2 para 5 = -3 caiu)
  const improved = delta > 0
  return (
    <span className="text-xs font-medium" style={{ color: improved ? '#4ADE80' : '#FBBF24' }}>
      {improved ? '↑' : '↓'} {Math.abs(delta)} {improved ? 'subiu' : 'desceu'}
    </span>
  )
}

export function RankingCard() {
  const [data, setData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/ranking')
      .then(r => r.json())
      .then((d: RankingData) => setData(d.empty ? null : d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6 flex items-center justify-center"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)', minHeight: 200 }}
      >
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="w-32 h-3 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
      >
        <div className="flex flex-col items-center py-6 text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Posicionamento sendo analisado. Primeiro resultado aparece na proxima segunda-feira.
          </p>
        </div>
      </div>
    )
  }

  const { primary, keywords } = data
  // Só mostrar keywords secundárias que TEM posição (sem dados = esconde)
  const others = keywords.filter(k => !k.isPrimary && k.currentPosition !== null)

  return (
    <div
      className="rounded-2xl p-6 animate-fade-in-up"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      {/* Keyword principal */}
      {primary && (
        <div className="mb-5">
          <p
            className="text-xs font-bold tracking-[0.12em] uppercase mb-4"
            style={{ color: 'rgba(255,255,255,0.38)' }}
          >
            Sua posição no Google
          </p>

          <div className="flex items-center gap-5">
            <PositionBadge position={primary.currentPosition} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                &ldquo;{primary.keyword}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-1">
                <DeltaIndicator delta={primary.delta} />
                {primary.topCompetitor && primary.currentPosition !== 1 && (
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    1o: {primary.topCompetitor} ({primary.topCompetitorReviews} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de evolução da keyword primária */}
      {primary && primary.history.length >= 2 && (
        <RankingChart data={primary.history} keyword={primary.keyword} />
      )}

      {/* Outras keywords */}
      {others.length > 0 && (
        <div>
          <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex flex-col gap-2.5">
            {others.map(kw => (
              <div
                key={kw.keyword}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-sm truncate flex-1 min-w-0" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {kw.keyword}
                </p>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <DeltaIndicator delta={kw.delta} />
                  <span
                    className="font-display font-bold text-sm"
                    style={{ color: kw.currentPosition ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }}
                  >
                    {kw.currentPosition ? `${kw.currentPosition}o` : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.lastTracked && (
        <p className="text-xs mt-4 text-right" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Atualizado: {new Date(data.lastTracked).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  )
}
