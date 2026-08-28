'use client'

import { PinIcon } from '@/components/ui/PinIcon'

interface Action {
  field: string
  message: string
  impact: number
  severity: string
}

export function NextActionsPanel({ actions }: { actions: Action[] }) {
  if (actions.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex justify-center mb-2">
          <PinIcon size={24} />
        </div>
        <p className="font-display font-bold text-white text-sm">Tudo em ordem</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Nenhuma ação crítica pendente</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {actions.map((action, i) => {
        const borderColor = action.severity === 'critical'
          ? 'rgba(248,113,113,0.25)'
          : 'rgba(252,211,77,0.2)'
        const iconColor = action.severity === 'critical'
          ? 'rgba(248,113,113,0.8)'
          : 'rgba(252,211,77,0.7)'

        return (
          <div
            key={i}
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${borderColor}` }}
          >
            <div style={{ marginTop: 2, color: iconColor, flexShrink: 0 }}>
              <PinIcon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white" style={{ lineHeight: 1.5 }}>{action.message}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                +{action.impact} pts ao corrigir
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
