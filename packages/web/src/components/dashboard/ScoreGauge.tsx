'use client'

function scoreTheme(score: number) {
  if (score >= 70) return { color: 'var(--success)', label: 'Seu perfil está ótimo!', glow: 'rgba(74,222,128,0.6)' }
  if (score >= 40) return { color: 'var(--warning)', label: 'Tem espaço para melhorar', glow: 'rgba(251,191,36,0.6)' }
  return { color: 'var(--error)', label: 'Precisa de atenção', glow: 'rgba(239,68,68,0.55)' }
}

// Gauge estilo speedometer: arco de 270° de 225° a 135° (sentido horário)
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

export function ScoreGauge({ score, size = 160, showGlow = true }: ScoreGaugeProps) {
  const { color, label, glow } = scoreTheme(score)

  const R = (size / 160) * 60
  const CX = size / 2
  const CY = (size / 160) * 82
  const svgHeight = (size / 160) * 145
  const fillSweep = (score / 100) * TOTAL_DEG
  const glowId = `gauge-glow-${score}-${size}`
  const fontSize = (size / 160) * 34
  const subFontSize = (size / 160) * 11

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {showGlow && (
        <p
          className="text-xs font-bold tracking-[0.15em] uppercase"
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

        {/* Fill com glow */}
        {fillSweep > 0 && (
          <path
            d={arcPath(CX, CY, R, START_DEG, fillSweep)}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            filter={showGlow ? `url(#${glowId})` : undefined}
            style={showGlow ? { filter: `drop-shadow(0 0 8px ${glow})` } : undefined}
          />
        )}

        {/* Score numero */}
        <text
          x={CX}
          y={CY + 8}
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
          y={CY + 27}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize={subFontSize}
          fontFamily="var(--font-body, sans-serif)"
        >
          de 100
        </text>
      </svg>

      {showGlow && (
        <p
          className="font-display font-bold text-sm text-center -mt-2"
          style={{ color, textShadow: `0 0 20px ${glow}` }}
        >
          {label}
        </p>
      )}
    </div>
  )
}
