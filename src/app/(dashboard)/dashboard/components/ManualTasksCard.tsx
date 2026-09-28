interface ManualTasksCardProps {
  photoCount: number
  unrepliedReviewCount: number
}

export function ManualTasksCard({ photoCount, unrepliedReviewCount }: ManualTasksCardProps) {
  const tasks: string[] = []

  if (photoCount < 5) {
    tasks.push('Adicionar fotos reais do seu espaco')
  }

  if (unrepliedReviewCount > 0) {
    tasks.push('Responder reviews que precisam de toque pessoal')
  }

  // Always visible unless all other tasks are done
  tasks.push('Manter horario de funcionamento atualizado')

  // If only the "horario" task remains and photos/reviews are fine, hide the card
  if (photoCount >= 5 && unrepliedReviewCount === 0) {
    return null
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
    >
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          Depende de voce
        </h2>
      </div>

      <div className="px-6 py-4 space-y-3">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: '#14B8A6' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#14B8A6' }} />
            </span>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{task}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
