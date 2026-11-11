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

interface HistoryEntry {
  gridData: GeoGridData
  keyword: string
  weekStart: string
}

interface GeoGridResponse {
  current: GeoGridData | null
  previous: GeoGridData | null
  keyword: string
  weekStart: string
  previousWeekStart: string | null
  history?: HistoryEntry[]
  empty?: boolean
}

const MapContent = dynamic(() => import('./GeoGridMapContent'), { ssr: false })

function statusColor(position: number | null): string {
  if (position === null) return '#6B7280'
  if (position <= 3) return '#4ADE80'
  if (position <= 10) return '#FBBF24'
  return '#F87171'
}

function statusLabel(position: number | null): string {
  if (position === null) return 'Invisível'
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

function formatWeek(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function GeoGridMap() {
  const [data, setData] = useState<GeoGridResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(0) // 0 = mais recente

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
          Mapa de visibilidade sendo calculado. Primeiro resultado aparece na próxima segunda.
        </p>
      </div>
    )
  }

  const history = data.history ?? [{ gridData: data.current, keyword: data.keyword, weekStart: data.weekStart }]
  const activeEntry = history[selectedWeek] ?? history[0]
  const grid = activeEntry.gridData
  const hasMultipleWeeks = history.length > 1

  // Comparação com a semana seguinte (mais antiga) no slider
  const compareEntry = history[selectedWeek + 1] ?? null
  const improvements = compareEntry
    ? grid.summary.strong - compareEntry.gridData.summary.strong
    : 0

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p
          className="text-[10px] font-medium tracking-[0.08em] uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Mapa de visibilidade
        </p>
        {hasMultipleWeeks && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.15)', color: '#C084FC' }}>
            {history.length} semanas
          </span>
        )}
      </div>
      <p className="text-[13px] mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Sua posição em {grid.points.length} pontos ao redor do seu endereço para &ldquo;{grid.keyword}&rdquo;
      </p>

      {/* Slider temporal (Story 5.8) */}
      {hasMultipleWeeks && (
        <div className="flex items-center gap-2 mb-3">
          {history.map((entry, i) => (
            <button
              key={entry.weekStart}
              onClick={() => setSelectedWeek(i)}
              className="text-[11px] px-2.5 py-1 rounded-full transition-all"
              style={{
                background: i === selectedWeek ? 'rgba(14,165,233,0.2)' : 'rgba(255,255,255,0.04)',
                color: i === selectedWeek ? '#0EA5E9' : 'var(--text-muted)',
                border: i === selectedWeek ? '1px solid rgba(14,165,233,0.3)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {i === 0 ? 'Atual' : formatWeek(entry.weekStart)}
            </button>
          ))}
        </div>
      )}

      {/* Mapa com pins */}
      <div className="h-[280px] rounded-xl overflow-hidden mb-3">
        <MapContent
          key={activeEntry.weekStart}
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
        <SummaryBadge label="invisível" count={grid.summary.invisible} color="#6B7280" />
      </div>

      {/* Resumo */}
      <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        Você aparece no top 3 em{' '}
        <span className="font-medium text-white">
          {grid.summary.strong} de {grid.points.length} pontos
        </span>
        {improvements > 0 && (
          <span style={{ color: '#4ADE80' }}> (+{improvements} vs semana anterior)</span>
        )}
        {improvements < 0 && (
          <span style={{ color: '#F87171' }}> ({improvements} vs semana anterior)</span>
        )}
      </p>

      <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
        {selectedWeek === 0 ? 'Atualizado' : 'Semana de'}: {new Date(activeEntry.weekStart).toLocaleDateString('pt-BR')}
      </p>
    </div>
  )
}
