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

  // Tudo que o Destaka faz automaticamente
  const destakaFields = [
    'description',        // Destaka escreve a descricao
    'review_response',    // Destaka responde avaliacoes
    'reply_rate',         // Destaka responde avaliacoes
    'posts',              // Destaka publica posts
    'post_recency',       // Destaka publica posts
    'attributes',         // Preenchido no onboarding, Destaka aplica
    'services_count',     // Preenchido no onboarding
    'services_desc',      // Preenchido no onboarding
  ]
  const destakaActions = actions.filter(a => destakaFields.includes(a.field))
  const userActions = actions.filter(a => !destakaFields.includes(a.field))

  return (
    <div className="flex flex-col gap-4">
      {destakaActions.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent-bright)' }}>O Destaka cuida disso</p>
          <div className="flex flex-col gap-2">
            {destakaActions.map((action, i) => (
              <ActionItem key={`d-${i}`} action={action} auto />
            ))}
          </div>
        </div>
      )}
      {userActions.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--warning)' }}>Precisa da sua ação</p>
          <div className="flex flex-col gap-2">
            {userActions.map((action, i) => (
              <ActionItem key={`u-${i}`} action={action} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ActionItem({ action, auto }: { action: Action; auto?: boolean }) {
  const borderColor = auto ? 'rgba(94,234,212,0.2)' : action.severity === 'critical' ? 'rgba(248,113,113,0.25)' : 'rgba(252,211,77,0.2)'
  const iconColor = auto ? 'var(--accent-bright)' : action.severity === 'critical' ? 'rgba(248,113,113,0.8)' : 'rgba(252,211,77,0.7)'

  return (
    <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${borderColor}` }}>
      <div style={{ marginTop: 2, color: iconColor, flexShrink: 0 }}>
        <PinIcon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white" style={{ lineHeight: 1.5 }}>{action.message}</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {auto ? 'Automático' : `+${action.impact} pts ao corrigir`}
        </p>
      </div>
    </div>
  )
}
