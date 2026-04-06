'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScoreCard, TotalScoreBadge } from './ScoreCard'
import { calculateScore } from '@/lib/gmb/scorer'
import type { CategoryScore } from '@/lib/gmb/scorer'

interface DiagnosticData {
  id: string
  score_total: number
  score_info_basica: number
  score_fotos: number
  score_avaliacoes: number
  score_posts: number
  score_servicos: number
  score_atributos: number
  issues: Array<{ field: string; severity: string; message: string; impact: number; category?: string }>
  created_at: string
}

interface Props {
  profileId: string
  profileName: string
}

type PanelState = 'loading' | 'running' | 'ready' | 'error'

export function DiagnosisPanel({ profileId, profileName }: Props) {
  const [state, setState] = useState<PanelState>('loading')
  const [diagnostic, setDiagnostic] = useState<DiagnosticData | null>(null)
  const [aiText, setAiText] = useState('')
  const [diagExpanded, setDiagExpanded] = useState(false)

  const runDiagnostic = useCallback(async () => {
    setState('running')
    const res = await fetch('/api/diagnostic/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId }),
    })
    if (res.ok) {
      const data = await res.json()
      setAiText(data.aiDiagnosis ?? '')
      // Recarrega o diagnóstico salvo
      await loadDiagnostic()
    } else {
      setState('error')
    }
  }, [profileId])

  const loadDiagnostic = useCallback(async () => {
    const res = await fetch(`/api/diagnostic/${profileId}`)
    if (res.ok) {
      const data = await res.json()
      if (data.diagnostic) {
        setDiagnostic(data.diagnostic)
        setState('ready')
      } else {
        await runDiagnostic()
      }
    } else {
      setState('error')
    }
  }, [profileId, runDiagnostic])

  useEffect(() => {
    loadDiagnostic()
  }, [loadDiagnostic])

  if (state === 'loading' || state === 'running') {
    return (
      <div className="text-center py-16">
        <div
          className="inline-block w-10 h-10 rounded-full border-2 border-t-transparent mb-6 animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: '#F59E0B' }}
        />
        <p className="font-display font-bold text-white text-lg">
          {state === 'running' ? 'Gerando diagnóstico...' : 'Carregando...'}
        </p>
        {state === 'running' && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8 }}>
            Analisando seu perfil com Claude. Leva até 30 segundos.
          </p>
        )}
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="text-center py-16">
        <p className="font-display font-bold text-white mb-4">Erro ao carregar diagnóstico.</p>
        <button
          onClick={loadDiagnostic}
          className="font-display font-bold text-sm px-5 py-2.5 rounded-xl"
          style={{ background: '#D97706', color: '#1C1917' }}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!diagnostic) return null

  // Reconstrói as categorias a partir dos dados do banco
  const categories: Record<string, CategoryScore> = {
    info: makeCategory('info', 'Informações Básicas', diagnostic.score_info_basica, 25, diagnostic.issues, 'info'),
    photos: makeCategory('photos', 'Fotos', diagnostic.score_fotos, 20, diagnostic.issues, 'photos'),
    reviews: makeCategory('reviews', 'Avaliações', diagnostic.score_avaliacoes, 25, diagnostic.issues, 'reviews'),
    posts: makeCategory('posts', 'Posts', diagnostic.score_posts, 15, diagnostic.issues, 'posts'),
    services: makeCategory('services', 'Serviços', diagnostic.score_servicos, 10, diagnostic.issues, 'services'),
    attributes: makeCategory('attributes', 'Atributos', diagnostic.score_atributos, 5, diagnostic.issues, 'attributes'),
  }

  const diagDate = new Date(diagnostic.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <div>
      {/* Score total */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <TotalScoreBadge score={diagnostic.score_total} />
        <div>
          <p className="font-display font-bold text-white text-lg mb-1">{profileName}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Diagnóstico de {diagDate}</p>
          <button
            onClick={runDiagnostic}
            className="mt-3 text-xs font-medium transition-colors"
            style={{ color: '#F59E0B' }}
          >
            Refazer diagnóstico
          </button>
        </div>
      </div>

      {/* Cards por categoria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {Object.values(categories).map(cat => (
          <ScoreCard key={cat.name} category={cat} />
        ))}
      </div>

      {/* Diagnóstico textual do Claude */}
      {aiText && (
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => setDiagExpanded(!diagExpanded)}
            className="w-full flex items-center justify-between"
          >
            <span className="font-display font-bold text-white text-sm">Análise completa</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{diagExpanded ? '▲' : '▼'}</span>
          </button>
          {diagExpanded && (
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {aiText}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function makeCategory(
  name: string,
  label: string,
  score: number,
  maxScore: number,
  allIssues: DiagnosticData['issues'],
  categoryKey: string
): CategoryScore {
  // Mapeia issues do banco para a categoria (usa o campo field como heurística)
  const fieldMap: Record<string, string[]> = {
    info: ['name', 'phone', 'address', 'hours', 'website', 'category'],
    photos: ['logo', 'space_photos', 'total_photos', 'cover'],
    reviews: ['reviews_count', 'rating', 'reply_rate'],
    posts: ['posts', 'post_recency'],
    services: ['services_count', 'services_desc'],
    attributes: ['attributes'],
  }
  const fields = fieldMap[categoryKey] ?? []
  const issues = allIssues.filter(i => fields.includes(i.field)).map(i => ({
    ...i,
    severity: i.severity as 'critical' | 'warning' | 'info',
  }))

  return {
    name,
    label,
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    issues,
  }
}
