'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'

interface RadiusPoint {
  week: string
  radius: number
}

interface GeoExpansionData {
  radiusHistory: RadiusPoint[]
  latestExpansion: {
    targetRegions: string[]
    actionCount: number
    currentRadius: number
    previousRadius: number | null
    radiusDelta: number | null
  } | null
}

export function GeoExpansionCard() {
  const [data, setData] = useState<GeoExpansionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/dashboard/geo-expansion')
        if (res.ok) {
          const json = await res.json()
          if (mounted) setData(json)
        }
      } catch {
        // silent
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <Card variant="subtle" padding="md">
        <div className="flex items-center justify-center py-6">
          <Spinner size="md" />
        </div>
      </Card>
    )
  }

  if (!data || data.radiusHistory.length === 0) {
    return (
      <Card variant="subtle" padding="md">
        <h3 className="font-display font-bold text-white text-[15px] mb-2">
          Expansao Geografica
        </h3>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Dados sendo coletados. O mapa de alcance aparece apos a primeira semana.
        </p>
      </Card>
    )
  }

  const history = data.radiusHistory
  const current = history[history.length - 1]
  const first = history[0]
  const totalGrowth = current && first ? current.radius - first.radius : 0
  const expansion = data.latestExpansion

  // Simple inline bar chart
  const maxRadius = Math.max(...history.map(h => h.radius), 1)

  return (
    <Card variant="accent" padding="md">
      <h3 className="font-display font-bold text-white text-[15px] mb-3">
        Expansao Geografica
      </h3>

      {/* Current radius */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-white">
          {current?.radius?.toFixed(1)}km
        </span>
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          raio de alcance
        </span>
        {totalGrowth > 0 && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full ml-auto"
            style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80' }}
          >
            +{totalGrowth.toFixed(1)}km desde o inicio
          </span>
        )}
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-1 mb-4" style={{ height: 48 }}>
        {history.map((point, i) => {
          const height = Math.max((point.radius / maxRadius) * 100, 8)
          const isLatest = i === history.length - 1
          return (
            <div
              key={point.week}
              className="flex-1 rounded-t transition-all"
              style={{
                height: `${height}%`,
                background: isLatest ? 'var(--accent-bright, #0EA5E9)' : 'rgba(14,165,233,0.25)',
                minWidth: 8,
              }}
              title={`${point.week}: ${point.radius.toFixed(1)}km`}
            />
          )
        })}
      </div>

      {/* Target regions */}
      {expansion && expansion.targetRegions.length > 0 && (
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Expandindo para:
          </p>
          <p className="text-sm text-white font-medium">
            {expansion.targetRegions.join(', ')}
          </p>
          {expansion.actionCount > 0 && (
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {expansion.actionCount} {expansion.actionCount === 1 ? 'acao executada' : 'acoes executadas'} esta semana
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
