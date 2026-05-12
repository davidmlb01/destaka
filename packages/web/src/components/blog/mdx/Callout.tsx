import type { ReactNode } from 'react'

const styles = {
  tip: {
    bg: '#F0FAF0',
    border: '#4ade80',
    icon: '💡',
    label: 'Dica',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#FBBF24',
    icon: '⚠️',
    label: 'Atenção',
  },
  info: {
    bg: '#EFF6FF',
    border: '#3B82F6',
    icon: 'ℹ️',
    label: 'Informação',
  },
} as const

interface CalloutProps {
  type?: keyof typeof styles
  title?: string
  children: ReactNode
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const s = styles[type]

  return (
    <div
      className="rounded-lg p-4 my-6"
      style={{
        background: s.bg,
        borderLeft: `4px solid ${s.border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{s.icon}</span>
        <div className="min-w-0">
          {title && (
            <p
              className="font-display font-semibold text-sm mb-1"
              style={{ color: '#0F2A1F' }}
            >
              {title}
            </p>
          )}
          <div className="text-sm" style={{ color: '#1A1A1A' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
