import type { CategoryScore } from '@/lib/gmb/scorer'
import { PinIcon } from '@/components/ui/PinIcon'

function severityColor(severity: string) {
  if (severity === 'critical') return 'var(--error)'
  if (severity === 'warning') return 'var(--warning)'
  return 'var(--accent)'
}

export function CategoryRow({ category, expanded, onToggle }: {
  category: CategoryScore
  expanded: boolean
  onToggle: () => void
}) {
  const perfect = category.issues.length === 0

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.2)',
        border: `1px solid ${perfect ? 'rgba(14,165,233,0.12)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={!perfect ? onToggle : undefined}
        style={{ cursor: perfect ? 'default' : 'pointer' }}
      >
        <PinIcon size={14} color={perfect ? 'var(--success)' : 'var(--accent)'} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-white">{category.label}</span>
            <span className="text-sm font-bold ml-3 shrink-0" style={{ color: 'var(--accent)' }}>
              {category.score === 0 ? '0' : category.score}/{category.maxScore}
            </span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{ width: `${category.percentage}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>

        <div className="shrink-0 ml-2" style={{ width: 20, textAlign: 'center' }}>
          {perfect ? (
            <span style={{ color: 'var(--success)', fontSize: 14 }}>&#10003;</span>
          ) : (
            <span
              className="text-xs block transition-transform duration-200"
              style={{
                color: 'var(--text-muted)',
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
            >
              &#9660;
            </span>
          )}
        </div>
      </button>

      {expanded && !perfect && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {category.issues.map((issue, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-2.5"
              style={{
                borderBottom: i < category.issues.length - 1
                  ? '1px solid rgba(255,255,255,0.04)'
                  : 'none',
              }}
            >
              <span
                className="inline-block rounded-full shrink-0"
                style={{
                  width: 8,
                  height: 8,
                  marginTop: 6,
                  background: severityColor(issue.severity),
                }}
              />
              <div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {issue.message}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  impacto: +{issue.impact} pts se corrigido
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
