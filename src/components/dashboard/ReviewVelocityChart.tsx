'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface VelocitySeries {
  name: string
  isSelf: boolean
  data: { date: string; count: number }[]
}

interface VelocityResponse {
  series: VelocitySeries[]
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

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)', minHeight: 200 }}
      >
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Carregando velocidade de avaliações...</p>
      </div>
    )
  }

  if (!data?.series.length) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)', minHeight: 200 }}
      >
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Dados de velocidade sendo coletados. Aparece após a segunda semana de monitoramento.
        </p>
      </div>
    )
  }

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
    </div>
  )
}
