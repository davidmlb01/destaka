'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface MrrPoint {
  month: string
  mrr: number
  leads: number
}

interface ScorePoint {
  month: string
  avgScore: number
  clients: number
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-card)', borderRadius: 8, padding: '8px 12px' }}>
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.name === 'MRR' ? `R$${p.value}` : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export function MrrLeadsChart({ data }: { data: MrrPoint[] }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>MRR e Leads por mes</h2>
      {data.length < 2 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Dados insuficientes para o grafico.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="mrr" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
            <YAxis yAxisId="leads" orientation="right" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<ChartTooltip />} />
            <Area yAxisId="mrr" type="monotone" dataKey="mrr" name="MRR" stroke="#14B8A6" fill="url(#mrrGrad)" strokeWidth={2} />
            <Area yAxisId="leads" type="monotone" dataKey="leads" name="Leads" stroke="#FBBF24" fill="url(#leadsGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function ScoreEvolutionChart({ data }: { data: ScorePoint[] }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Score medio por mes</h2>
      {data.length < 2 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Dados insuficientes para o grafico.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="avgScore" name="Score" stroke="#4ADE80" fill="url(#scoreGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
