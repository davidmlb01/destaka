'use client'

import { memo } from 'react'
import type { CategoryScore } from '@/lib/gmb/scorer'
import { getScoreColor, getScoreLabel } from '@/lib/utils/score-colors'
import { PinIcon } from '@/components/ui/PinIcon'

function scoreToColor(percentage: number): string {
  if (percentage === 0) return 'rgba(255,255,255,0.5)'
  return getScoreColor(percentage)
}

export const ScoreCard = memo(function ScoreCard({ category }: { category: CategoryScore }) {
  const color = scoreToColor(category.percentage)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <PinIcon size={18} />
            <span className="font-display font-bold text-white text-sm">{category.label}</span>
          </div>
          <div className="text-right">
            <span className="font-display font-extrabold" style={{ color, fontSize: 20 }}>
              {category.score}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>/{category.maxScore}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-full rounded-full h-1.5 mb-3"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${category.percentage}%`,
              background: color,
              boxShadow: category.percentage > 0 ? `0 0 6px ${color}88` : 'none',
            }}
          />
        </div>

      </div>
    </div>
  )
})

export function TotalScoreBadge({ score }: { score: number }) {
  const color = scoreToColor(score)
  const label = score === 0 ? 'Não configurado' : getScoreLabel(score)

  return (
    <div
      className="inline-flex flex-col items-center justify-center rounded-2xl px-8 py-6"
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33` }}
    >
      <span className="font-display font-extrabold" style={{ fontSize: 56, color, lineHeight: 1 }}>
        {score}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>de 100 pontos</span>
      <span className="font-display font-bold text-sm mt-2" style={{ color }}>
        {label}
      </span>
    </div>
  )
}
