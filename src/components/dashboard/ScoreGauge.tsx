'use client'

function scoreTheme(score: number) {
  if (score >= 70) return { statusColor: 'var(--success)', label: 'Perfil otimizado' }
  if (score >= 40) return { statusColor: 'var(--warning)', label: 'Espaço para crescer' }
  return { statusColor: 'var(--error)', label: 'Precisa de atenção' }
}

function scoreDescription(score: number): string {
  if (score < 40) return 'A maioria dos clientes não encontra seu perfil nas buscas.'
  if (score < 70) return 'Seu perfil aparece, mas concorrentes estão à frente.'
  return 'Você está entre os perfis mais visíveis da região.'
}

const ARC_COLOR = 'var(--accent)'
const ARC_GLOW = 'rgba(14,165,233,0.6)'

const START_DEG = 225
const TOTAL_DEG = 270

function toRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180
}

function pt(cx: number, cy: number, r: number, deg: number) {
  return {
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  }
}

function arcPath(cx: number, cy: number, r: number, fromDeg: number, sweep: number) {
  if (sweep <= 0) return ''
  const toDeg = fromDeg + sweep
  const s = pt(cx, cy, r, fromDeg)
  const e = pt(cx, cy, r, toDeg)
  const large = sweep > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

interface ScoreGaugeProps {
  score: number
  size?: number
  showGlow?: boolean
}

export function ScoreGauge({ score, size = 180, showGlow = true }: ScoreGaugeProps) {
  const { statusColor, label } = scoreTheme(score)

  const R = (size / 160) * 60
  const CX = size / 2
  const CY = (size / 160) * 82
  const svgHeight = (size / 160) * 145
  const fillSweep = (score / 100) * TOTAL_DEG
  const glowId = `gauge-glow-${score}-${size}`
  const fontSize = (size / 160) * 38
  const subFontSize = (size / 160) * 11

  return (
    <div className="flex flex-col items-center w-full">
      {showGlow && (
        <p
          className="text-[10px] font-medium tracking-[0.08em] uppercase mb-3"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Score Destaka
        </p>
      )}

      <svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`} style={{ overflow: 'visible' }}>
        {showGlow && (
          <defs>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}

        {/* Track */}
        <path
          d={arcPath(CX, CY, R, START_DEG, TOTAL_DEG)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Fill */}
        {fillSweep > 0 && (
          <path
            d={arcPath(CX, CY, R, START_DEG, fillSweep)}
            fill="none"
            stroke={ARC_COLOR}
            strokeWidth="12"
            strokeLinecap="round"
            filter={showGlow ? `url(#${glowId})` : undefined}
            style={showGlow ? { filter: `drop-shadow(0 0 8px ${ARC_GLOW})` } : undefined}
          />
        )}

        {/* Score numero (hero) */}
        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          fill="white"
          fontSize={fontSize}
          fontWeight="800"
          fontFamily="var(--font-display, sans-serif)"
        >
          {score}
        </text>

        {/* "de 100" */}
        <text
          x={CX}
          y={CY + 28}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize={subFontSize}
          fontWeight="500"
          fontFamily="var(--font-body, sans-serif)"
        >
          de 100
        </text>
      </svg>

      {showGlow && (
        <div className="flex flex-col items-center gap-2 mt-1">
          <p
            className="font-display font-medium text-[13px] text-center"
            style={{ color: statusColor, opacity: 0.85 }}
          >
            {label}
          </p>
          <p
            className="text-[13px] text-center"
            style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 220, lineHeight: 1.5 }}
          >
            {scoreDescription(score)}
          </p>
        </div>
      )}
    </div>
  )
}
