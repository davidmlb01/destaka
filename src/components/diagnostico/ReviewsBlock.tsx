'use client'

interface ReviewsBlockProps {
  unansweredCount: number
  lastReviewDate: string | null
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const then = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
}

export default function ReviewsBlock({ unansweredCount, lastReviewDate }: ReviewsBlockProps) {
  const diasUltimaAvaliacao = daysSince(lastReviewDate)
  const hasPending = unansweredCount > 0

  return (
    <section aria-labelledby="reviews-heading">
      <h2
        id="reviews-heading"
        className="font-display font-bold mb-6"
        style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px' }}
      >
        Suas avaliacoes no Google
      </h2>

      <div
        className="rounded-2xl p-6 md:p-8"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
      >
        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--card-dark)' }}
          >
            <p
              className="font-mono font-bold"
              style={{
                fontSize: 28,
                lineHeight: 1,
                color: hasPending ? 'var(--warning)' : 'var(--success)',
                letterSpacing: '-0.5px',
              }}
            >
              {unansweredCount}
            </p>
            <p className="mt-2" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              sem resposta
            </p>
          </div>

          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--card-dark)' }}
          >
            <p
              className="font-mono font-bold"
              style={{
                fontSize: 28,
                lineHeight: 1,
                color: 'var(--text-primary)',
                letterSpacing: '-0.5px',
              }}
            >
              {diasUltimaAvaliacao !== null ? diasUltimaAvaliacao : '-'}
            </p>
            <p className="mt-2" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {diasUltimaAvaliacao !== null ? 'dias desde a ultima avaliacao' : 'sem avaliacoes'}
            </p>
          </div>
        </div>

        {/* Copy condicional */}
        {hasPending ? (
          <>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Cada avaliacao sem resposta e um paciente que se sentiu ignorado. O Google tambem percebe: perfis que respondem avaliacoes recebem ate 35% mais visibilidade nos resultados de busca.
            </p>
            <p className="mt-3" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              O Destaka responde avaliacoes com inteligencia artificial em menos de 1 hora. Respostas personalizadas, no tom certo, sem voce precisar digitar uma palavra.
            </p>
          </>
        ) : (
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Parabens, todas as suas avaliacoes estao respondidas. O Destaka mant&eacute;m esse ritmo automaticamente para voce.
          </p>
        )}
      </div>
    </section>
  )
}
