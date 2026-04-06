'use client'

interface MetricCardProps {
  label: string
  value: number
  icon: string
  hint: string
}

export function MetricCard({ label, value, icon, hint }: MetricCardProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {hint}
        </span>
      </div>
      <p className="font-display font-extrabold text-white" style={{ fontSize: 28, lineHeight: 1 }}>
        {value.toLocaleString('pt-BR')}
      </p>
      <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </p>
    </div>
  )
}
