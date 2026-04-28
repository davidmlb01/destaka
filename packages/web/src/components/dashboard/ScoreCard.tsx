'use client'

import { useState } from 'react'
import type { CategoryScore } from '@/lib/gmb/scorer'

const CATEGORY_ICONS: Record<string, string> = {
  info: '📋',
  photos: '📸',
  reviews: '⭐',
  posts: '📝',
  services: '🏥',
  attributes: '✅',
}

function scoreToColor(percentage: number): string {
  if (percentage === 0) return 'rgba(255,255,255,0.35)'
  if (percentage >= 70) return '#4ADE80'
  if (percentage >= 40) return '#FBBF24'
  return '#FB923C'
}

export function ScoreCard({ category }: { category: CategoryScore }) {
  const [expanded, setExpanded] = useState(false)
  const color = scoreToColor(category.percentage)
  const icon = CATEGORY_ICONS[category.name] ?? '📊'
  const hasIssues = category.issues.length > 0

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span className="font-display font-bold text-white text-sm">{category.label}</span>
          </div>
          <div className="text-right">
            <span className="font-display font-extrabold" style={{ color, fontSize: 20 }}>
              {category.score}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>/{category.maxScore}</span>
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

        {hasIssues && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {expanded ? '▲ ocultar' : `▼ ${category.issues.length} ${category.issues.length === 1 ? 'problema' : 'problemas'}`}
          </button>
        )}
      </div>

      {expanded && hasIssues && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {category.issues.map((issue, i) => (
            <div
              key={i}
              className="px-5 py-3 flex items-start gap-3"
              style={{ borderBottom: i < category.issues.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              <span style={{ fontSize: 13, marginTop: 1 }}>
                {issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  {issue.message}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  impacto: {issue.impact} pts
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TotalScoreBadge({ score }: { score: number }) {
  const color = scoreToColor(score)
  const label = score >= 70 ? 'Excelente' : score >= 40 ? 'Regular' : score === 0 ? 'Não configurado' : 'Crítico'

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
