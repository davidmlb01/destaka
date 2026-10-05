'use client'

interface ReviewsSectionProps {
  unansweredCount: number
  lastReviewDate: string | null
}

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function ReviewsSection({ unansweredCount, lastReviewDate }: ReviewsSectionProps) {
  const dias = lastReviewDate ? daysSince(lastReviewDate) : null
  const hasIssues = unansweredCount > 0 || (dias !== null && dias > 14)

  if (!hasIssues) return null

  return (
    <section>
      <h2
        className="font-display font-bold"
        style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: 16 }}
      >
        Suas avaliações no Google
      </h2>

      <div className="flex flex-wrap gap-4">
        {unansweredCount > 0 && (
          <div
            className="flex-1"
            style={{
              minWidth: 200,
              padding: '20px 16px',
              borderRadius: 14,
              background: 'var(--card-dark)',
              border: '1px solid var(--warning-border)',
              textAlign: 'center',
            }}
          >
            <span className="font-mono font-bold" style={{ fontSize: 32, color: 'var(--warning)' }}>
              {unansweredCount}
            </span>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {unansweredCount === 1 ? 'avaliação sem resposta' : 'avaliações sem resposta'}
            </p>
          </div>
        )}

        {dias !== null && dias > 0 && (
          <div
            className="flex-1"
            style={{
              minWidth: 200,
              padding: '20px 16px',
              borderRadius: 14,
              background: 'var(--card-dark)',
              border: `1px solid ${dias > 30 ? 'var(--error-border)' : 'var(--border-card)'}`,
              textAlign: 'center',
            }}
          >
            <span className="font-mono font-bold" style={{ fontSize: 32, color: dias > 30 ? 'var(--error)' : 'var(--text-primary)' }}>
              {dias}
            </span>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              dias desde a última avaliação
            </p>
          </div>
        )}
      </div>

      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.6 }}>
        {unansweredCount > 0
          ? 'Cada avaliação sem resposta é um cliente que se sentiu ignorado. O Google também penaliza perfis que não respondem.'
          : `Faz ${dias} dias que você não recebe avaliações. Perfis ativos recebem até 3x mais visibilidade.`
        }
      </p>
    </section>
  )
}
