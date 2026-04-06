'use client'

function scoreTheme(score: number) {
  if (score >= 70) return { color: '#4ADE80', label: 'Seu perfil está ótimo!' }
  if (score >= 40) return { color: '#FBBF24', label: 'Tem espaço para melhorar' }
  return { color: '#FB923C', label: 'Precisa de atenção' }
}

// Gauge estilo speedometer: arco de 270° de 225° a 135° (sentido horário)
// Nunca passa pelo ponto inferior (180°), então não corta no SVG
const R = 60
const CX = 80
const CY = 82
const START_DEG = 225
const TOTAL_DEG = 270

function toRad(deg: number) {
  return ((deg - 90) * Math.PI) / 180
}

function pt(deg: number) {
  return {
    x: CX + R * Math.cos(toRad(deg)),
    y: CY + R * Math.sin(toRad(deg)),
  }
}

function arcPath(fromDeg: number, sweep: number) {
  if (sweep <= 0) return ''
  const toDeg = fromDeg + sweep
  const s = pt(fromDeg)
  const e = pt(toDeg)
  const large = sweep > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

export function ScoreGauge({ score }: { score: number }) {
  const { color, label } = scoreTheme(score)
  const fillSweep = (score / 100) * TOTAL_DEG

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="160" height="145" viewBox="0 0 160 145">
        {/* Track */}
        <path
          d={arcPath(START_DEG, TOTAL_DEG)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="13"
          strokeLinecap="round"
        />
        {/* Fill */}
        {fillSweep > 0 && (
          <path
            d={arcPath(START_DEG, fillSweep)}
            fill="none"
            stroke={color}
            strokeWidth="13"
            strokeLinecap="round"
          />
        )}
        {/* Score */}
        <text
          x={CX}
          y={CY + 8}
          textAnchor="middle"
          fill="white"
          fontSize="32"
          fontWeight="800"
          fontFamily="var(--font-display, sans-serif)"
        >
          {score}
        </text>
        <text
          x={CX}
          y={CY + 26}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize="11"
          fontFamily="var(--font-body, sans-serif)"
        >
          de 100
        </text>
      </svg>

      <p className="font-display font-bold text-sm text-center -mt-2" style={{ color }}>
        {label}
      </p>
    </div>
  )
}
