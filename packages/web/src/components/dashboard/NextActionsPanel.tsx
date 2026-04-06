'use client'

interface Action {
  field: string
  message: string
  impact: number
  severity: string
}

const FIELD_ICONS: Record<string, string> = {
  phone: '📞',
  hours: '🕐',
  website: '🌐',
  logo: '🖼️',
  space_photos: '📸',
  total_photos: '📷',
  cover: '🎨',
  reviews_count: '⭐',
  rating: '🌟',
  reply_rate: '💬',
  posts: '📝',
  post_recency: '📅',
  services_count: '🏥',
  services_desc: '📋',
  attributes: '✅',
  default: '⚡',
}

export function NextActionsPanel({ actions }: { actions: Action[] }) {
  if (actions.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-display font-bold text-white text-sm">Tudo em ordem</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Nenhuma ação crítica pendente</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {actions.map((action, i) => {
        const icon = FIELD_ICONS[action.field] ?? FIELD_ICONS.default
        const borderColor = action.severity === 'critical'
          ? 'rgba(248,113,113,0.25)'
          : 'rgba(252,211,77,0.2)'

        return (
          <div
            key={i}
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${borderColor}` }}
          >
            <span style={{ fontSize: 18, marginTop: 1 }}>{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white" style={{ lineHeight: 1.5 }}>{action.message}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                +{action.impact} pts ao corrigir
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
