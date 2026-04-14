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
  if (!rating) return <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>sem dados</span>
  return (
    <span style={{ color: '#FBBF24', fontSize: 13 }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  )
}

function BenchmarkCard({ data }: { data: BenchmarkData }) {
  return (
    <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 10 }}>{data.summary}</p>

      {data.alerts.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {data.alerts.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ color: '#F87171', fontSize: 12, marginTop: 1 }}>!</span>
              <span style={{ color: '#FCA5A5', fontSize: 12 }}>{a}</span>
            </div>
          ))}
        </div>
      )}

      {data.gaps.length > 0 && (
        <div>
          {data.gaps.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ color: '#34D399', fontSize: 12, marginTop: 1 }}>+</span>
              <span style={{ color: '#6EE7B7', fontSize: 12 }}>{g}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CompetitorCard({ comp, profile }: { comp: Competitor; profile: Profile }) {
  const ratingDiff = (profile.avg_rating ?? 0) - (comp.avg_rating ?? 0)
  const reviewDiff = (profile.review_count ?? 0) - comp.review_count

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: 0 }}>{comp.name}</h3>
          {comp.address && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>{comp.address}</p>
          )}
        </div>
        {comp.has_website && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 20 }}>
            tem site
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ textAlign: 'center', padding: '8px 0', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          <StarBar rating={comp.avg_rating} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0' }}>nota</p>
          {comp.avg_rating !== null && profile.avg_rating !== null && (
            <p style={{ fontSize: 11, margin: '2px 0 0', color: ratingDiff > 0 ? '#34D399' : ratingDiff < 0 ? '#F87171' : 'rgba(255,255,255,0.4)' }}>
              {ratingDiff > 0 ? `+${ratingDiff.toFixed(1)} você` : ratingDiff < 0 ? `${ratingDiff.toFixed(1)} você` : 'igual'}
            </p>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>{comp.review_count}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0' }}>avaliações</p>
          {profile.review_count !== null && (
            <p style={{ fontSize: 11, margin: '2px 0 0', color: reviewDiff > 0 ? '#34D399' : reviewDiff < 0 ? '#F87171' : 'rgba(255,255,255,0.4)' }}>
              {reviewDiff > 0 ? `+${reviewDiff} você` : reviewDiff < 0 ? `${reviewDiff} você` : 'igual'}
            </p>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>{comp.photo_count}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0' }}>fotos</p>
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
    const json = await res.json() as { discovered: number; errors: string[] }
    const n = json.discovered
    setMsg(`${n} ${n === 1 ? 'concorrente encontrado' : 'concorrentes encontrados'}${json.errors.length ? ` (${json.errors.length} ${json.errors.length === 1 ? 'erro' : 'erros'})` : ''}.`)
    await load()
    setDiscovering(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Concorrentes</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0' }}>
            Esses são seus Top 3 concorrentes na sua especialidade e região
          </p>
        </div>
        <button
          onClick={handleDiscover}
          disabled={discovering}
          style={{
            background: discovering ? 'rgba(255,255,255,0.1)' : 'rgba(217,119,6,0.8)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: discovering ? 'not-allowed' : 'pointer',
          }}
        >
          {discovering ? 'Buscando...' : 'Atualizar'}
        </button>
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.1)', borderRadius: 10, marginBottom: 16 }}>
          <p style={{ color: '#34D399', fontSize: 13, margin: 0 }}>{msg}</p>
        </div>
      )}

      {!data?.competitors.length ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 16 }}>
            Nenhum concorrente mapeado ainda.
          </p>
          <button
            onClick={handleDiscover}
            disabled={discovering}
            style={{
              background: 'rgba(217,119,6,0.8)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
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
