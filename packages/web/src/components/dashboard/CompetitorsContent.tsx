'use client'

import { useEffect, useState } from 'react'
import type { Competitor, BenchmarkData } from '@/lib/gmb/competitors'

interface Profile {
  id: string
  name: string
  avg_rating: number | null
  review_count: number | null
}

interface CompetitorsData {
  profile: Profile
  competitors: Competitor[]
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

export function CompetitorsContent() {
  const [data, setData] = useState<CompetitorsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [discovering, setDiscovering] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/competitors')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  async function handleDiscover() {
    setDiscovering(true)
    setMsg('')
    const res = await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ benchmark: true }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string }
      setMsg(err.error ?? 'Erro ao buscar concorrentes. Tente novamente.')
      setDiscovering(false)
      return
    }
    const json = await res.json() as { discovered: number; errors: string[] }
    const n = json.discovered
    setMsg(`${n} ${n === 1 ? 'concorrente encontrado' : 'concorrentes encontrados'}${json.errors.length ? ` (${json.errors.length} ${json.errors.length === 1 ? 'erro' : 'erros'})` : ''}.`)
    await load()
    setDiscovering(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl animate-pulse"
            style={{ height: 140, background: 'var(--card-subtle)' }}
          />
        ))}
      </div>
    )
  }

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
              <span
                className="inline-block w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'rgba(252,211,77,0.3)', borderTopColor: 'var(--accent-bright)' }}
              />
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
        data.competitors.map(comp => (
          <CompetitorCard key={comp.id} comp={comp} profile={data.profile} />
        ))
      )}
    </div>
  )
}
