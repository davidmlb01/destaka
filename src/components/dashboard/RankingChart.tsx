'use client'

interface DataPoint {
  position: number | null
  date: string
}

interface RankingChartProps {
  data: DataPoint[]
  keyword: string
}

export function RankingChart({ data, keyword }: RankingChartProps) {
  if (data.length < 2) return null

  const validPoints = data.filter(d => d.position !== null) as Array<{ position: number; date: string }>
  if (validPoints.length < 2) return null

  // Chart dimensions
  const width = 320
  const height = 120
  const padding = { top: 20, right: 16, bottom: 24, left: 28 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  // Scale: posição 1 = topo, posição 20 = fundo (invertido)
  const maxPos = Math.max(...validPoints.map(p => p.position), 10)
  const minPos = 1

  const xScale = (i: number) => padding.left + (i / (validPoints.length - 1)) * chartW
  const yScale = (pos: number) => padding.top + ((pos - minPos) / (maxPos - minPos)) * chartH

  // Gerar path
  const points = validPoints.map((p, i) => ({
    x: xScale(i),
    y: yScale(p.position),
    pos: p.position,
    date: p.date,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Cor neutra (accent) para não dar impressão negativa
  // O eixo Y já comunica a direção (1o no topo, 20o embaixo)
  const lineColor = 'var(--accent-bright, #5EEAD4)'

  // Labels de posição no eixo Y
  const yLabels = [1, Math.ceil(maxPos / 2), maxPos]

  return (
    <div className="mt-4">
      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
        Evolução: &ldquo;{keyword}&rdquo;
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: 120 }}
      >
        {/* Grid lines */}
        {yLabels.map(pos => (
          <g key={pos}>
            <line
              x1={padding.left}
              y1={yScale(pos)}
              x2={width - padding.right}
              y2={yScale(pos)}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 6}
              y={yScale(pos) + 3}
              textAnchor="end"
              fill="rgba(255,255,255,0.25)"
              fontSize="9"
            >
              {pos}º
            </text>
          </g>
        ))}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={i === points.length - 1 ? 4 : 2.5}
              fill={i === points.length - 1 ? lineColor : 'rgba(255,255,255,0.15)'}
              stroke={lineColor}
              strokeWidth={i === points.length - 1 ? 2 : 0}
            />
            {/* Posição no último ponto */}
            {i === points.length - 1 && (
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                fill={lineColor}
                fontSize="10"
                fontWeight="bold"
              >
                {p.pos}º
              </text>
            )}
          </g>
        ))}

        {/* Date labels */}
        {[points[0], points[points.length - 1]].map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 4}
            textAnchor={i === 0 ? 'start' : 'end'}
            fill="rgba(255,255,255,0.2)"
            fontSize="8"
          >
            {new Date(validPoints[i === 0 ? 0 : validPoints.length - 1].date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </text>
        ))}
      </svg>
    </div>
  )
}
