'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

interface GridPoint {
  lat: number
  lng: number
  position: number | null
  totalRelevant: number
  topCompetitor: string | null
}

interface GeoGridData {
  center: { lat: number; lng: number }
  radiusKm: number
  gridSize: number
  keyword: string
  points: GridPoint[]
  summary: {
    strong: number
    medium: number
    weak: number
    invisible: number
  }
}

interface GeoGridResponse {
  current: GeoGridData | null
  previous: GeoGridData | null
  keyword: string
  weekStart: string
  previousWeekStart: string | null
  empty?: boolean
}

const MapContent = dynamic(() => import('./GeoGridMapContent'), { ssr: false })

function statusColor(position: number | null): string {
  if (position === null) return '#6B7280' // cinza (invisivel)
  if (position <= 3) return '#4ADE80' // verde (strong)
  if (position <= 10) return '#FBBF24' // amarelo (medium)
  return '#F87171' // vermelho (weak)
}

function statusLabel(position: number | null): string {
  if (position === null) return 'Invisivel'
  if (position <= 3) return `${position}o lugar`
  if (position <= 10) return `${position}o lugar`
  return `${position}o lugar`
}

function SummaryBadge({ label, count, color }: { label: string; count: number; color: string }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-full" style={{ width: 8, height: 8, background: color }} />
      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        {count} {label}
      </span>
    </div>
  )
}

export function GeoGridMap() {
  const [data, setData] = useState<GeoGridResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/geo-grid')
      .then(r => r.json())
      .then((d: GeoGridResponse) => setData(d.empty ? null : d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)', minHeight: 200 }}
      >
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Carregando mapa de visibilidade...</p>
      </div>
    )
  }

  if (!data?.current) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)', minHeight: 200 }}
      >
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Mapa de visibilidade sendo calculado. Primeiro resultado aparece na proxima segunda.
        </p>
      </div>
    )
  }

  const grid = data.current
  const prevGrid = data.previous

  // Calcular mudanças vs semana anterior
  const improvements = prevGrid ? grid.summary.strong - prevGrid.summary.strong : 0

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <p
        className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2"
        style={{ color: 'var(--text-muted)' }}
      >
        Mapa de visibilidade
      </p>
      <p className="text-[13px] mb-4" style={{ color: 'var(--text-tertiary)' }}>
        Sua posicao em {grid.points.length} pontos ao redor do seu endereco para &ldquo;{grid.keyword}&rdquo;
      </p>

      {/* Mapa com pins */}
      <div className="h-[280px] rounded-xl overflow-hidden mb-3">
        <MapContent
          center={grid.center}
          points={grid.points.map(p => ({
            lat: p.lat,
            lng: p.lng,
            color: statusColor(p.position),
            label: statusLabel(p.position),
            position: p.position,
          }))}
        />
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mb-2">
        <SummaryBadge label="top 3" count={grid.summary.strong} color="#4ADE80" />
        <SummaryBadge label="4o-10o" count={grid.summary.medium} color="#FBBF24" />
        <SummaryBadge label="11o+" count={grid.summary.weak} color="#F87171" />
        <SummaryBadge label="invisivel" count={grid.summary.invisible} color="#6B7280" />
      </div>

      {/* Resumo */}
      <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        Voce aparece no top 3 em{' '}
        <span className="font-medium text-white">
          {grid.summary.strong} de {grid.points.length} pontos
        </span>
        {improvements > 0 && (
          <span style={{ color: '#4ADE80' }}> (+{improvements} vs semana anterior)</span>
        )}
      </p>

      <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
        Atualizado: {new Date(data.weekStart).toLocaleDateString('pt-BR')}
      </p>
    </div>
  )
}
