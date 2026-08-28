'use client'

interface WeeklyHighlightsData {
  posts_published: number
  reviews_replied: number
  score_delta: number
}

interface WeeklyHighlightsProps {
  data: WeeklyHighlightsData | null
}

export function WeeklyHighlights({ data }: WeeklyHighlightsProps) {
  if (!data) return null

  const { posts_published, reviews_replied, score_delta } = data

  // Só exibir se houve alguma atividade na semana
  if (posts_published === 0 && reviews_replied === 0 && score_delta === 0) return null

  const parts: string[] = []
  if (posts_published > 0) {
    parts.push(`${posts_published} post${posts_published > 1 ? 's' : ''} publicado${posts_published > 1 ? 's' : ''}`)
  }
  if (reviews_replied > 0) {
    parts.push(`${reviews_replied} avaliação${reviews_replied > 1 ? 'ões' : ''} respondida${reviews_replied > 1 ? 's' : ''}`)
  }
  if (score_delta > 0) {
    parts.push(`Score +${score_delta} pontos`)
  } else if (score_delta < 0) {
    parts.push(`Score ${score_delta} pontos`)
  }

  if (parts.length === 0) return null

  return (
    <div
      className="rounded-2xl px-5 py-4 flex items-center gap-3 animate-fade-in-up"
      style={{
        background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(14,165,233,0.02) 100%)',
        border: '1px solid rgba(14,165,233,0.15)',
      }}
    >
      <span
        className="flex items-center justify-center rounded-lg text-sm shrink-0"
        style={{
          width: 32,
          height: 32,
          background: 'rgba(14,165,233,0.12)',
          border: '1px solid rgba(14,165,233,0.2)',
          color: '#0EA5E9',
        }}
      >
        ✦
      </span>
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Esta semana:
        </span>{' '}
        {parts.join(' · ')}
      </p>
    </div>
  )
}
