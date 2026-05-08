'use client'

interface Action {
  id: string
  type: string
  status: string
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  update_info: 'Informações atualizadas',
  add_photo: 'Foto adicionada',
  add_post: 'Post publicado',
  add_service: 'Serviço cadastrado',
  add_services: 'Serviços adicionados',
  reply_review: 'Avaliação respondida',
  update_hours: 'Horário atualizado',
  update_category: 'Categoria atualizada',
  add_attribute: 'Atributo configurado',
  update_attributes: 'Atributos atualizados',
  update_description: 'Descrição atualizada',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  done: { label: 'Concluído', color: '#4ADE80', dot: '#4ADE80' },
  in_progress: { label: 'Em andamento', color: '#FBBF24', dot: '#FBBF24' },
  pending: { label: 'Pendente', color: 'rgba(255,255,255,0.35)', dot: 'rgba(255,255,255,0.2)' },
  failed: { label: 'Falhou', color: 'var(--error)', dot: 'var(--error)' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function typeLabel(type: string) {
  return TYPE_LABELS[type] ?? type.replace(/_/g, ' ')
}

export function OptimizationHistory({ actions }: { actions: Action[] }) {
  if (!actions.length) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 80 }}
      >
        <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Nenhuma otimização registrada ainda.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {actions.map((action, i) => {
        const cfg = STATUS_CONFIG[action.status] ?? STATUS_CONFIG.pending
        return (
          <div
            key={action.id}
            className="flex items-center gap-3 px-5 py-3.5"
            style={{
              borderBottom: i < actions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}
          >
            {/* Status dot */}
            <div
              className="shrink-0 rounded-full"
              style={{ width: 8, height: 8, background: cfg.dot }}
            />

            {/* Label + data */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{typeLabel(action.type)}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {formatDate(action.created_at)}
              </p>
            </div>

            {/* Status badge */}
            <span
              className="text-xs font-medium shrink-0"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
