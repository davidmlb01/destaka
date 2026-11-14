'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

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

interface ConversionData {
  payingOrgs: number
  freeOrgs: number
  cancelledOrgs: number
  leadToPayingRate: number
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--admin-bg-card)', border: '1px solid var(--admin-border-card)', borderRadius: 8, padding: '8px 12px' }}>
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--admin-text-secondary)' }}>{label}</p>
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
      className="rounded-2xl p-5 admin-section-hover"
      style={{
        background: 'var(--admin-bg-card)',
        backgroundImage: 'var(--admin-gradient-card)',
        border: '1px solid rgba(20,184,166,0.2)',
        boxShadow: 'var(--admin-shadow-md)',
      }}
    >
      <h2 className="font-semibold mb-1" style={{ color: 'var(--admin-text-heading)', fontSize: 15 }}>MRR e Leads por mes</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--admin-text-muted)' }}>Receita recorrente e volume de leads</p>
      {data.length < 2 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>Dados insuficientes para o gráfico.</p>
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(142,182,155,0.08)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--admin-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="mrr" tick={{ fill: 'var(--admin-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
            <YAxis yAxisId="leads" orientation="right" tick={{ fill: 'var(--admin-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
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
      className="rounded-2xl p-5 admin-section-hover"
      style={{
        background: 'var(--admin-bg-card)',
        backgroundImage: 'var(--admin-gradient-card)',
        border: '1px solid var(--admin-border-card)',
        boxShadow: 'var(--admin-shadow-md)',
      }}
    >
      <h2 className="font-semibold mb-1" style={{ color: 'var(--admin-text-heading)', fontSize: 15 }}>Score médio</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--admin-text-muted)' }}>Evolução mensal dos clientes</p>
      {data.length < 2 ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>Dados insuficientes para o gráfico.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8EB69B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8EB69B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(142,182,155,0.08)" />
            <XAxis dataKey="month" tick={{ fill: 'var(--admin-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--admin-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="avgScore" name="Score" stroke="#8EB69B" fill="url(#scoreGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function ConversionDonutChart({ payingOrgs, freeOrgs, cancelledOrgs, leadToPayingRate }: ConversionData) {
  const data = [
    { name: 'Pagantes', value: payingOrgs,   color: '#4ADE80' },
    { name: 'Free',     value: freeOrgs,     color: '#235347' },
    { name: 'Cancelados', value: cancelledOrgs, color: '#F87171' },
  ].filter(d => d.value > 0)

  const hasData = data.length > 0 && data.some(d => d.value > 0)

  return (
    <div
      className="rounded-2xl p-5 admin-section-hover"
      style={{
        background: 'var(--admin-bg-card)',
        backgroundImage: 'var(--admin-gradient-accent)',
        border: '1px solid rgba(74,222,128,0.18)',
        boxShadow: 'var(--admin-shadow-md)',
      }}
    >
      <h2 className="font-semibold" style={{ color: 'var(--admin-text-heading)', fontSize: 15 }}>Conversão</h2>
      <p className="text-xs mt-0.5 mb-4" style={{ color: 'var(--admin-text-muted)' }}>Lead para pagante</p>

      {!hasData ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--admin-text-muted)' }}>Sem dados de conversão.</p>
      ) : (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Label central SVG sobreposto */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--admin-text-heading)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {leadToPayingRate}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>conversao</div>
          </div>
        </div>
      )}

      {/* Legenda */}
      {hasData && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          {data.map(d => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} aria-hidden="true" />
              <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{d.name} ({d.value})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
