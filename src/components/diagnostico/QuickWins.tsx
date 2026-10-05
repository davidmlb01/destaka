'use client'

import type { DiagGap } from './useDiagnostico'

interface QuickWinsProps {
  gaps: DiagGap[]
}

function categorize(gap: DiagGap): 'instantaneo' | 'medio_prazo' | 'longo_prazo' {
  const instant = ['description', 'categories', 'attributes', 'services', 'hours', 'website']
  const medium = ['photos', 'posts', 'review_response']
  if (instant.includes(gap.field)) return 'instantaneo'
  if (medium.includes(gap.field)) return 'medio_prazo'
  return 'longo_prazo'
}

const categoryConfig = {
  instantaneo: {
    label: 'Ajustes instantâneos',
    sublabel: 'O Destaka aplica em menos de 24h',
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    border: 'var(--success-border)',
    icon: '⚡',
  },
  medio_prazo: {
    label: 'Melhorias de médio prazo',
    sublabel: 'Resultados em 2 a 4 semanas',
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    border: 'var(--warning-border)',
    icon: '📈',
  },
  longo_prazo: {
    label: 'Crescimento contínuo',
    sublabel: 'Efeito composto ao longo dos meses',
    color: 'var(--accent-bright)',
    bg: 'var(--accent-bg)',
    border: 'var(--accent-border)',
    icon: '🎯',
  },
} as const

export default function QuickWins({ gaps }: QuickWinsProps) {
  if (!gaps.length) return null

  const grouped = {
    instantaneo: gaps.filter(g => categorize(g) === 'instantaneo'),
    medio_prazo: gaps.filter(g => categorize(g) === 'medio_prazo'),
    longo_prazo: gaps.filter(g => categorize(g) === 'longo_prazo'),
  }

  const totalImpact = gaps.reduce((sum, g) => sum + g.impact, 0)

  return (
    <section>
      <h2
        className="font-display font-bold"
        style={{ fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3, letterSpacing: '-0.3px', marginBottom: 8 }}
      >
        O que o Destaka corrige no seu perfil
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
        Identificamos <strong style={{ color: 'var(--text-primary)' }}>{gaps.length} oportunidades</strong> que podem aumentar seu score em até <strong className="font-mono" style={{ color: 'var(--accent-bright)' }}>+{totalImpact} pontos</strong>.
      </p>

      <div className="flex flex-col gap-5">
        {(['instantaneo', 'medio_prazo', 'longo_prazo'] as const).map(cat => {
          const items = grouped[cat]
          if (!items.length) return null
          const config = categoryConfig[cat]
          const catImpact = items.reduce((sum, g) => sum + g.impact, 0)

          return (
            <div
              key={cat}
              style={{
                padding: '16px 20px',
                borderRadius: 14,
                background: config.bg,
                border: `1px solid ${config.border}`,
              }}
            >
              {/* Header da categoria */}
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 16 }}>{config.icon}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: config.color }}>{config.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{config.sublabel}</p>
                  </div>
                </div>
                <span
                  className="font-mono font-bold"
                  style={{ fontSize: 15, color: config.color }}
                >
                  +{catImpact} pts
                </span>
              </div>

              {/* Itens */}
              <div className="flex flex-col gap-2">
                {items.map((gap, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3"
                    style={{ paddingLeft: 4 }}
                  >
                    <span style={{ color: config.color, fontSize: 14, marginTop: 2, flexShrink: 0 }}>✓</span>
                    <div className="flex-1">
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {gap.message}
                      </span>
                    </div>
                    <span
                      className="font-mono"
                      style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}
                    >
                      +{gap.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
