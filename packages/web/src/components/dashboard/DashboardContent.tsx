'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScoreGauge } from './ScoreGauge'
import { ScoreCard } from './ScoreCard'
import { MetricCard } from './MetricCard'
import { NextActionsPanel } from './NextActionsPanel'
import { ScoreChart } from './ScoreChart'
import { OptimizationHistory } from './OptimizationHistory'
import { OptimizationWizard } from './OptimizationWizard'
import { DashboardSkeleton } from './Skeletons'
import type { CategoryScore } from '@/lib/gmb/scorer'

const FIELD_MAP: Record<string, string[]> = {
  info: ['name', 'phone', 'address', 'hours', 'website', 'category'],
  photos: ['logo', 'space_photos', 'total_photos', 'cover'],
  reviews: ['reviews_count', 'rating', 'reply_rate'],
  posts: ['posts', 'post_recency'],
  services: ['services_count', 'services_desc'],
  attributes: ['attributes'],
}

const CATEGORY_META = [
  { key: 'info', label: 'Informações Básicas', max: 25, scoreField: 'score_info_basica' },
  { key: 'photos', label: 'Fotos', max: 20, scoreField: 'score_fotos' },
  { key: 'reviews', label: 'Avaliações', max: 25, scoreField: 'score_avaliacoes' },
  { key: 'posts', label: 'Posts', max: 15, scoreField: 'score_posts' },
  { key: 'services', label: 'Serviços', max: 10, scoreField: 'score_servicos' },
  { key: 'attributes', label: 'Atributos', max: 5, scoreField: 'score_atributos' },
]

interface DashboardData {
  profile: { id: string; name: string; address: string; score: number; last_synced_at: string | null }
  diagnostic: (Record<string, number> & { issues: Array<{ field: string; severity: string; message: string; impact: number }> }) | null
  scoreHistory: Array<{ score_total: number; created_at: string }>
  recentActions: Array<{ id: string; type: string; status: string; created_at: string }>
  metrics: { viewsSearch: number; viewsMaps: number; clicksWebsite: number; clicksCall: number; clicksDirections: number; period: string }
  nextActions: Array<{ field: string; message: string; impact: number; severity: string }>
}

export function DashboardContent() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [diagnosticId, setDiagnosticId] = useState<string>('')

  async function load() {
    const res = await fetch('/api/dashboard', { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      setData(json)
      setDiagnosticId(json.diagnostic?.id ?? '')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleSync() {
    if (!data || syncing) return
    setSyncing(true)
    await fetch('/api/diagnostic/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: data.profile.id }),
    })
    await load()
    setSyncing(false)
  }

  useEffect(() => { load() }, [])

  if (loading || !data) return <DashboardSkeleton />

  const { profile, diagnostic, scoreHistory, metrics, nextActions } = data

  const categories: CategoryScore[] = CATEGORY_META.map(m => {
    const score = diagnostic ? ((diagnostic[m.scoreField] as number) ?? 0) : 0
    const issues = !diagnostic ? [] : (diagnostic.issues ?? [])
      .filter(i => FIELD_MAP[m.key]?.includes(i.field))
      .map(i => ({ ...i, severity: i.severity as 'critical' | 'warning' | 'info' }))
    return {
      name: m.key,
      label: m.label,
      score,
      maxScore: m.max,
      percentage: Math.round((score / m.max) * 100),
      issues,
    }
  })

  const lastSync = profile.last_synced_at
    ? new Date(profile.last_synced_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'nunca'

  return (
    <div className="flex flex-col gap-8">

      {/* Linha 1: Score gauge + métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Gauge */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ScoreGauge score={diagnostic?.score_total ?? 0} />

          <OptimizationWizard
            profileId={profile.id}
            diagnosticId={diagnosticId}
            onComplete={load}
          />

          <div className="w-full flex items-center justify-between">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Sync: {lastSync}
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: syncing ? 'rgba(255,255,255,0.06)' : 'rgba(217,119,6,0.15)',
                color: syncing ? 'rgba(255,255,255,0.3)' : '#FCD34D',
                border: '1px solid rgba(217,119,6,0.2)',
              }}
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <MetricCard label="Buscas no Google" value={metrics.viewsSearch} icon="🔍" hint={metrics.period} />
          <MetricCard label="Visualizações no Maps" value={metrics.viewsMaps} icon="📍" hint={metrics.period} />
          <MetricCard label="Cliques no site" value={metrics.clicksWebsite} icon="🌐" hint={metrics.period} />
          <MetricCard label="Ligações geradas" value={metrics.clicksCall} icon="📞" hint={metrics.period} />
        </div>
      </div>

      {/* Linha 2: Cards de categoria */}
      <div>
        <p className="font-display font-bold text-white text-sm mb-3" style={{ opacity: 0.7 }}>
          Score por categoria
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => <ScoreCard key={cat.name} category={cat} />)}
        </div>
      </div>

      {/* Linha 3: Próximas ações + Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Próximas ações */}
        <div>
          <p className="font-display font-bold text-white text-sm mb-3" style={{ opacity: 0.7 }}>
            Próximas ações
          </p>
          <NextActionsPanel actions={nextActions} />
        </div>

        {/* Evolução do score */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="font-display font-bold text-white text-sm mb-4" style={{ opacity: 0.7 }}>
            Evolução do score
          </p>
          <ScoreChart data={scoreHistory} />
        </div>
      </div>

      {/* Linha 4: Histórico de otimizações */}
      <div>
        <p className="font-display font-bold text-white text-sm mb-3" style={{ opacity: 0.7 }}>
          Histórico de otimizações
        </p>
        <OptimizationHistory actions={data.recentActions} />
      </div>

    </div>
  )
}
