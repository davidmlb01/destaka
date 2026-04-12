interface AuditReport {
  gaps?: string[]
  strengths?: string[]
  priority_actions?: string[]
  overall_health?: string
}

export function AuditGapsCard({ auditReport }: { auditReport: AuditReport | null }) {
  if (!auditReport) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Diagnóstico do perfil</p>
        <p className="text-sm text-slate-400">Auditoria em andamento. Disponível em instantes.</p>
      </div>
    )
  }

  const gaps = auditReport.gaps ?? []
  const actions = auditReport.priority_actions ?? []

  if (gaps.length === 0 && actions.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">O que melhorar no seu perfil</h2>
      </div>

      <div className="px-6 py-4 space-y-3">
        {actions.slice(0, 3).map((action, i) => (
          <div key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-slate-700 leading-relaxed">{action}</p>
          </div>
        ))}

        {gaps.slice(0, 2).map((gap, i) => (
          <div key={`gap-${i}`} className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center mt-0.5">!</span>
            <p className="text-sm text-slate-600 leading-relaxed">{gap}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
