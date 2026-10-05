'use client'

import type { DiagConcorrente } from './useDiagnostico'

interface CompetitorsSectionProps {
  concorrentes: DiagConcorrente[]
  userRating: number
  userReviewCount: number
  userName: string
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span style={{ color: 'var(--warning)', fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
    </span>
  )
}

export default function CompetitorsSection({ concorrentes, userRating, userReviewCount, userName }: CompetitorsSectionProps) {
  if (!concorrentes.length) return null

  const bestCompetitorRating = Math.max(...concorrentes.map(c => c.avg_rating ?? 0))
  const isUserBehind = userRating < bestCompetitorRating

  return (
    <section>
      <h2
        className="font-display font-bold"
        style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: 8 }}
      >
        Quem aparece quando seus clientes pesquisam
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
        Esses profissionais aparecem antes de você. Não porque são melhores. Porque estão mais visíveis.
      </p>

      <div className="flex flex-col gap-3">
        {concorrentes.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between"
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: 'var(--card-subtle)',
              border: '1px solid var(--border-card)',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="font-mono font-bold"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--accent-bg)',
                  color: 'var(--accent-bright)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</p>
                <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                  <StarRating rating={c.avg_rating ?? 0} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.review_count} avaliações</span>
                </div>
              </div>
            </div>
            <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {(c.avg_rating ?? 0).toFixed(1)}
            </span>
          </div>
        ))}

        {/* Card do usuário */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: isUserBehind ? 'var(--error-bg)' : 'var(--success-bg)',
            border: `1px solid ${isUserBehind ? 'var(--error-border)' : 'var(--success-border)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="font-mono font-bold"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: isUserBehind ? 'var(--error-bg)' : 'var(--success-bg)',
                color: isUserBehind ? 'var(--error)' : 'var(--success)',
                border: `1px solid ${isUserBehind ? 'var(--error)' : 'var(--success)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {concorrentes.length + 1}
            </span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: isUserBehind ? 'var(--error)' : 'var(--success)' }}>
                {userName || 'Você'}
              </p>
              <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                <StarRating rating={userRating} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{userReviewCount} avaliações</span>
              </div>
            </div>
          </div>
          <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: isUserBehind ? 'var(--error)' : 'var(--success)' }}>
            {userRating.toFixed(1)}
          </span>
        </div>
      </div>

      {isUserBehind && (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.6, fontStyle: 'italic' }}>
          A diferença entre você e quem aparece primeiro não é competência. É visibilidade.
        </p>
      )}
    </section>
  )
}
