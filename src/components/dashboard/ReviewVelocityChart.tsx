'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface VelocitySeries {
  name: string
  isSelf: boolean
  data: { date: string; count: number }[]
}

interface OvertakePrediction {
  competitorName: string
  competitorCount: number
  userCount: number
  gap: number
  weeksToOvertake: number | null
  userVelocity: number
  competitorVelocity: number
}

interface VelocityResponse {
  series: VelocitySeries[]
  predictions?: OvertakePrediction[]
  empty?: boolean
}

const COLORS = ['#0EA5E9', '#F87171', '#FBBF24', '#A78BFA']

function formatDate(d: string) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

export function ReviewVelocityChart() {
  const [data, setData] = useState<VelocityResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/velocity')
      .then(r => r.json())
      .then((d: VelocityResponse) => setData(d.empty ? null : d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Esconder completamente quando não tem dados suficientes (< 2 semanas)
  if (loading) return null

  if (!data?.series.length) return null

  // Precisa de pelo menos 2 datas para mostrar gráfico (senão é só pontos soltos)
  const allDatesCount = new Set(data.series.flatMap(s => s.data.map(d => d.date))).size
  if (allDatesCount < 2) return null

  // Construir dados para Recharts: cada ponto no eixo X é uma data, cada série é uma linha
  const allDates = [...new Set(data.series.flatMap(s => s.data.map(d => d.date)))].sort()

  const chartData = allDates.map(date => {
    const point: Record<string, string | number> = { date: formatDate(date) }
    for (const s of data.series) {
      const entry = s.data.find(d => d.date === date)
      if (entry) point[s.name] = entry.count
    }
    return point
  })

  // Calcular velocity (reviews/semana) para tooltip
  const velocities = data.series.map(s => {
    if (s.data.length < 2) return { name: s.name, velocity: 0 }
    const first = s.data[0]
    const last = s.data[s.data.length - 1]
    const weeks = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (7 * 24 * 60 * 60 * 1000))
    return { name: s.name, velocity: Math.round(((last.count - first.count) / weeks) * 10) / 10 }
  })

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <p
        className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        Velocidade de avaliações
      </p>
      <p className="text-[13px] mb-4" style={{ color: 'var(--text-tertiary)' }}>
        Avaliações acumuladas: você vs concorrentes
      </p>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}
            />
            {data.series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={COLORS[i] ?? '#6B7280'}
                strokeWidth={s.isSelf ? 2.5 : 1.5}
                strokeDasharray={s.isSelf ? undefined : '4 2'}
                dot={{ r: 3, fill: COLORS[i] ?? '#6B7280' }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Velocity badges */}
      <div className="flex flex-wrap gap-3 mt-3">
        {velocities.map((v, i) => {
          const isSelf = data.series[i]?.isSelf
          return (
            <div key={v.name} className="flex items-center gap-1.5">
              <span
                className="rounded-full"
                style={{ width: 8, height: 8, background: COLORS[i] ?? '#6B7280' }}
              />
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {isSelf ? 'Você' : v.name.split(' ').slice(0, 2).join(' ')}:{' '}
                <span className="font-medium" style={{ color: isSelf ? '#0EA5E9' : 'var(--text-secondary)' }}>
                  {v.velocity}/sem
                </span>
              </span>
            </div>
          )
        })}
      </div>
      {/* Previsões de ultrapassagem (Story 5.5) */}
      {data.predictions && data.predictions.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
            Previsão de ultrapassagem
          </p>
          <div className="flex flex-col gap-1.5">
            {data.predictions.map(p => {
              const timeText = p.weeksToOvertake === null
                ? 'No ritmo atual, não ultrapassa'
                : p.weeksToOvertake === 0
                  ? 'Você já está à frente'
                  : p.weeksToOvertake <= 4
                    ? `~${p.weeksToOvertake} semanas`
                    : `~${Math.round(p.weeksToOvertake / 4.3)} meses`

              const color = p.weeksToOvertake === 0
                ? '#4ADE80'
                : p.weeksToOvertake !== null && p.weeksToOvertake <= 12
                  ? '#FBBF24'
                  : 'var(--text-muted)'

              return (
                <div key={p.competitorName} className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                    {p.competitorName.split(' ').slice(0, 3).join(' ')}
                    <span style={{ color: 'var(--text-muted)' }}> ({p.competitorCount} avaliações, {p.gap > 0 ? `+${p.gap}` : p.gap} vs você)</span>
                  </span>
                  <span className="text-[12px] font-medium" style={{ color }}>
                    {timeText}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
