import Link from 'next/link'

interface ManualTasksCardProps {
  photoCount: number
  unrepliedReviewCount: number
}

interface TaskItem {
  message: string
  href: string
  external?: boolean
}

export function ManualTasksCard({ photoCount, unrepliedReviewCount }: ManualTasksCardProps) {
  if (photoCount >= 5 && unrepliedReviewCount === 0) {
    return null
  }

  const tasks: TaskItem[] = []

  if (unrepliedReviewCount > 0) {
    tasks.push({
      message: `${unrepliedReviewCount} ${unrepliedReviewCount === 1 ? 'avaliação sem resposta' : 'avaliações sem resposta'}`,
      href: '/dashboard/reviews',
    })
  }

  if (photoCount < 5) {
    tasks.push({
      message: `Adicione fotos reais do seu espaço (${photoCount}/5)`,
      href: 'https://business.google.com',
      external: true,
    })
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
          Ações que precisam de você
        </h2>
      </div>

      <div className="px-3 py-2">
        {tasks.map((task, i) => {
          const inner = (
            <div
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <div
                className="flex-shrink-0 w-2 h-2 rounded-full"
                style={{ background: '#FBBF24' }}
              />
              <p className="flex-1 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {task.message}
              </p>
              <svg
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                style={{ flexShrink: 0, color: 'rgba(255,255,255,0.3)' }}
              >
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )

          if (task.external) {
            return (
              <a key={i} href={task.href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            )
          }

          return (
            <Link key={i} href={task.href}>
              {inner}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
