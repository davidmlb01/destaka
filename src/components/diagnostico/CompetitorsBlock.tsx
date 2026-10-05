'use client'

import type { DiagConcorrente } from './useDiagnostico'

interface CompetitorsBlockProps {
  concorrentes: DiagConcorrente[]
  userRating: number
  userReviewCount: number
  userName: string
  especialidade: string
}

function StarRating({ rating }: { rating: number }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{ color: i <= Math.round(rating) ? 'var(--warning)' : 'rgba(255,255,255,0.15)' }}
      >
        ★
      </span>
    )
  }
  return <span className="inline-flex gap-0.5" style={{ fontSize: 14 }}>{stars}</span>
}

export default function CompetitorsBlock({
  concorrentes,
  userRating,
  userReviewCount,
  userName,
  especialidade,
}: CompetitorsBlockProps) {
  // Construir lista com usuário incluído para ranking
  const allEntries = [
    ...concorrentes.map((c) => ({
      name: c.name,
      rating: c.avg_rating ?? 0,
      reviewCount: c.review_count,
      isUser: false,
    })),
    {
      name: userName || 'Você',
      rating: userRating,
      reviewCount: userReviewCount,
      isUser: true,
    },
  ].sort((a, b) => b.rating - a.rating)

  const userPosition = allEntries.findIndex((e) => e.isUser) + 1
  const userIsBehind = userPosition > 1

  // Mostrar top 3 + usuário se não estiver no top 3
  const displayEntries = allEntries.slice(0, 3)
  const userInTop3 = displayEntries.some((e) => e.isUser)
  if (!userInTop3) {
    displayEntries.push(allEntries.find((e) => e.isUser)!)
  }

  return (
    <section aria-labelledby="competitors-heading">
      <h2
        id="competitors-heading"
        className="font-display font-bold mb-3"
        style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px' }}
      >
        Quem aparece quando seus pacientes pesquisam
      </h2>

      <p className="mb-6" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Quando alguém procura por &ldquo;{especialidade} perto de mim&rdquo;, estes são os profissionais que aparecem primeiro. Não porque são melhores que você. Porque estão mais visíveis.
      </p>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card-subtle)', border: '1px solid var(--border-card)' }}
      >
        <div className="flex flex-col md:flex-row">
          {displayEntries.map((entry, i) => {
            const position = allEntries.findIndex((e) => e.name === entry.name) + 1
            const isLast = i === displayEntries.length - 1
            const borderColor = entry.isUser
              ? userIsBehind ? 'var(--error)' : 'var(--success)'
              : 'var(--border-card)'

            return (
              <div
                key={entry.name}
                className="flex-1 p-5"
                style={{
                  borderBottom: !isLast ? '1px solid var(--border-card)' : 'none',
                  borderRight: 'none',
                  ...(entry.isUser ? { border: `1px solid ${borderColor}`, borderRadius: 12, margin: 4 } : {}),
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  {/* Badge posição */}
                  <span
                    className="flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0"
                    style={{
                      width: 24,
                      height: 24,
                      background: entry.isUser && userIsBehind ? 'var(--error-bg)' : 'var(--accent-bg)',
                      color: entry.isUser && userIsBehind ? 'var(--error)' : 'var(--accent-bright)',
                    }}
                  >
                    {position}
                  </span>
                  <span
                    className="font-display font-medium truncate"
                    style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.4 }}
                  >
                    {entry.isUser ? `Você: ${entry.name}` : entry.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <StarRating rating={entry.rating} />
                  <span className="font-mono" style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {entry.rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    ({entry.reviewCount} avaliações)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Copy emocional */}
      <p className="mt-6" style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {userIsBehind
          ? 'Nunca mais sinta a sensação de ver profissionais menos competentes que você conquistando muito mais clientes. A diferença entre você e quem aparece primeiro não é competência. É visibilidade.'
          : 'Você está bem posicionado, mas seus concorrentes estão investindo para ultrapassar. Manter a liderança exige consistência.'
        }
      </p>

      {/* Desktop: side-by-side cards */}
      <style>{`
        @media (min-width: 768px) {
          section[aria-labelledby="competitors-heading"] .flex-col.md\\:flex-row {
            flex-direction: row;
          }
          section[aria-labelledby="competitors-heading"] .flex-col.md\\:flex-row > div {
            border-bottom: none !important;
            border-right: 1px solid var(--border-card);
          }
          section[aria-labelledby="competitors-heading"] .flex-col.md\\:flex-row > div:last-child {
            border-right: none !important;
          }
        }
      `}</style>
    </section>
  )
}
