interface AuditReport {
  gaps?: string[]
  strengths?: string[]
  priority_actions?: string[]
  overall_health?: string
}

function toStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.map(item => typeof item === 'string' ? item : JSON.stringify(item))
}

export function AuditGapsCard({ auditReport }: { auditReport: AuditReport | null }) {
  if (!auditReport || typeof auditReport !== 'object') {
    return (
      <div className="rounded-2xl p-6" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Diagnostico do perfil</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Auditoria em andamento. Disponivel em instantes.</p>
      </div>
    )
  }

  const gaps = toStringArray(auditReport.gaps)
  const actions = toStringArray(auditReport.priority_actions)

  if (gaps.length === 0 && actions.length === 0) return null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>O que melhorar no seu perfil</h2>
      </div>

      <div className="px-6 py-4 space-y-3">
        {actions.slice(0, 3).map((action, i) => (
          <div key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5" style={{ background: 'var(--accent)', color: '#fff' }}>
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{action}</p>
          </div>
        ))}

        {gaps.slice(0, 2).map((gap, i) => (
          <div key={`gap-${i}`} className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold flex items-center justify-center mt-0.5">!</span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{gap}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
