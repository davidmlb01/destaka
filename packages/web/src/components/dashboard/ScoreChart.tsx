'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDateShort } from '@/lib/utils/format-date'

interface DataPoint {
  score_total: number
  created_at: string
}

function formatDate(iso: string) {
  return formatDateShort(iso)
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm"
      style={{ background: 'var(--modal-bg)', border: '1px solid var(--border-card)', color: '#fff' }}
    >
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{label}</p>
      <p className="font-display font-bold" style={{ color: '#4ADE80' }}>{payload[0].value} pts</p>
    </div>
  )
}

export function ScoreChart({ data }: { data: DataPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-32" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
        Dados insuficientes para o gráfico. Refaça diagnósticos ao longo do tempo.
      </div>
    )
  }

  const chartData = data.map(d => ({
    date: formatDate(d.created_at),
    score: d.score_total,
  }))

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#4ADE80"
          strokeWidth={2}
          dot={{ fill: '#4ADE80', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#4ADE80' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
