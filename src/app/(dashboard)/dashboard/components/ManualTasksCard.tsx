interface ManualTasksCardProps {
  photoCount: number
  unrepliedReviewCount: number
}

export function ManualTasksCard({ photoCount, unrepliedReviewCount }: ManualTasksCardProps) {
  const tasks: Array<{ text: string; hint: string }> = []

  if (photoCount < 5) {
    tasks.push({
      text: 'Adicionar fotos reais do seu espaço',
      hint: `Você tem ${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'}. O ideal são pelo menos 5.`,
    })
  }

  if (unrepliedReviewCount > 0) {
    tasks.push({
      text: 'Responder avaliações pendentes',
      hint: `${unrepliedReviewCount} ${unrepliedReviewCount === 1 ? 'avaliação precisa' : 'avaliações precisam'} de resposta.`,
    })
  }

  tasks.push({
    text: 'Manter horário de funcionamento atualizado',
    hint: 'Horários errados frustram pacientes e prejudicam seu ranking.',
  })

  if (photoCount >= 5 && unrepliedReviewCount === 0) {
    return null
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="font-display font-bold text-white text-sm">Só você pode fazer</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          Tarefas que o Destaka não consegue automatizar.
        </p>
      </div>

      <div className="px-5 py-3">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-start gap-3 py-2.5"
            style={{ borderBottom: i < tasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
          >
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5"
              style={{ borderColor: 'var(--accent)' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white">{task.text}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{task.hint}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
