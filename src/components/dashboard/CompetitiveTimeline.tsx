'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface TimelineData {
  positionSeries: { date: string; position: number; topCompetitor: string | null }[]
  reviewSeries: { date: string; reviews: number }[]
  empty?: boolean
}

function formatDate(d: string) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

export function CompetitiveTimeline() {
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/competitive-timeline')
      .then(r => r.json())
      .then((d: TimelineData) => setData(d.empty ? null : d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (!data) return null

  const hasPositions = data.positionSeries.length >= 2
  const hasReviews = data.reviewSeries.length >= 2

  if (!hasPositions && !hasReviews) return null

  // Merge por data para gráfico combinado
  const allDates = [...new Set([
    ...data.positionSeries.map(p => p.date),
    ...data.reviewSeries.map(r => r.date),
  ])].sort()

  const chartData = allDates.map(date => {
    const pos = data.positionSeries.find(p => p.date === date)
    const rev = data.reviewSeries.find(r => r.date === date)
    return {
      date: formatDate(date),
      posição: pos?.position ?? null,
      avaliações: rev?.reviews ?? null,
    }
  })

  // Posição atual vs primeira
  const firstPos = data.positionSeries[0]?.position
  const lastPos = data.positionSeries[data.positionSeries.length - 1]?.position
  const posDelta = firstPos && lastPos ? firstPos - lastPos : 0 // positivo = melhorou

  return (
    <div
      className="rounded-2xl p-5 mt-6"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: 'var(--text-muted)' }}>
          Evolução competitiva
        </p>
        {posDelta !== 0 && (
          <span
            className="text-[11px] font-medium"
            style={{ color: posDelta > 0 ? '#4ADE80' : '#F87171' }}
          >
            {posDelta > 0 ? `↑ ${posDelta} posições` : `↓ ${Math.abs(posDelta)} posições`}
          </span>
        )}
      </div>
      <p className="text-[13px] mb-4" style={{ color: 'var(--text-tertiary)' }}>
        Sua posição no ranking e avaliações ao longo do tempo
      </p>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            {hasPositions && (
              <YAxis
                yAxisId="pos"
                orientation="left"
                reversed
                domain={[1, 'dataMax']}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Posição', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: 'rgba(255,255,255,0.3)' } }}
              />
            )}
            {hasReviews && (
              <YAxis
                yAxisId="rev"
                orientation="right"
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Avaliações', angle: 90, position: 'insideRight', style: { fontSize: 9, fill: 'rgba(255,255,255,0.3)' } }}
              />
            )}
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            />
            {hasPositions && (
              <Line
                yAxisId="pos"
                type="monotone"
                dataKey="posição"
                stroke="#0EA5E9"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0EA5E9' }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            )}
            {hasReviews && (
              <Line
                yAxisId="rev"
                type="monotone"
                dataKey="avaliações"
                stroke="#A78BFA"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={{ r: 2, fill: '#A78BFA' }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-2">
        {hasPositions && (
          <div className="flex items-center gap-1.5">
            <span className="rounded-full" style={{ width: 8, height: 8, background: '#0EA5E9' }} />
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Posição no ranking</span>
          </div>
        )}
        {hasReviews && (
          <div className="flex items-center gap-1.5">
            <span className="rounded-full" style={{ width: 8, height: 8, background: '#A78BFA' }} />
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Avaliações acumuladas</span>
          </div>
        )}
      </div>
    </div>
  )
}
