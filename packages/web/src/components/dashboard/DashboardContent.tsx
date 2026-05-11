'use client'

import { Card } from '@/components/ui/Card'
import { ScoreGauge } from './ScoreGauge'
import { ScoreCard } from './ScoreCard'
import { MetricCard } from './MetricCard'
import { NextActionsPanel } from './NextActionsPanel'
import dynamic from 'next/dynamic'
const ScoreChart = dynamic(() => import('./ScoreChart').then(m => m.ScoreChart), { ssr: false, loading: () => <div className="h-[200px]" /> })
import { OptimizationHistory } from './OptimizationHistory'
import { OptimizationWizard } from './OptimizationWizard'
import { ProfileAlerts } from './ProfileAlerts'
import { WeeklyHighlights } from './WeeklyHighlights'
import { DashboardSkeleton } from './Skeletons'
import { PinIcon } from '@/components/ui/PinIcon'
import { useDashboard } from './hooks/useDashboard'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p
        className="text-xs font-bold tracking-[0.12em] uppercase shrink-0"
        style={{ color: 'rgba(255,255,255,0.38)' }}
      >
        {children}
      </p>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

export function DashboardContent() {
  const {
    data,
    error,
    isLoading,
    mutate,
    syncing,
    diagnosticId,
    categories,
    lastSync,
    handleSync,
  } = useDashboard()

  if (isLoading) return <DashboardSkeleton />

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="mb-4" style={{ opacity: 0.3 }}><PinIcon size={48} /></div>
      <h2 className="font-display font-bold text-white text-[20px] mb-2">
        Não foi possível carregar o painel
      </h2>
      <p className="text-[14px] mb-6" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 400 }}>
        Houve um problema ao conectar com o servidor. Verifique sua conexão e tente novamente.
      </p>
      <button
        onClick={() => mutate()}
        className="px-6 py-3 rounded-lg font-display font-semibold text-[14px] transition-all hover:brightness-110"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        Tentar novamente
      </button>
    </div>
  )

  const { profile, diagnostic, scoreHistory, metrics, nextActions, weeklySummary } = data

  return (
    <div className="flex flex-col gap-8">

      {/* Resumo semanal */}
      <WeeklyHighlights data={weeklySummary} />

      {/* Alertas de alteração no perfil */}
      <ProfileAlerts />

      {/* Linha 1: Score gauge + métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch animate-fade-in-up">

        {/* Gauge */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ScoreGauge score={diagnostic?.score_total ?? 0} />

          <OptimizationWizard
            profileId={profile.id}
            diagnosticId={diagnosticId}
            onComplete={() => mutate()}
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
                background: syncing ? 'rgba(255,255,255,0.06)' : 'rgba(14,165,233,0.15)',
                color: syncing ? 'rgba(255,255,255,0.3)' : 'var(--accent-bright)',
                border: '1px solid rgba(14,165,233,0.2)',
              }}
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3 content-start">
          <MetricCard label="Buscas no Google" value={metrics.viewsSearch} icon={<PinIcon size={16} />} hint={metrics.period} />
          <MetricCard label="Visualizações no Maps" value={metrics.viewsMaps} icon={<PinIcon size={16} />} hint={metrics.period} />
          <MetricCard label="Cliques no site" value={metrics.clicksWebsite} icon={<PinIcon size={16} />} hint={metrics.period} />
          <MetricCard label="Ligações geradas" value={metrics.clicksCall} icon={<PinIcon size={16} />} hint={metrics.period} />
        </div>
      </div>

      {/* Linha 2: Cards de categoria */}
      <div className="animate-fade-in-up stagger-2">
        <SectionTitle>Score por categoria</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => <ScoreCard key={cat.name} category={cat} />)}
        </div>
      </div>

      {/* Linha 3: Próximas ações + Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up stagger-4">

        {/* Próximas ações */}
        <div>
          <SectionTitle>Próximas ações</SectionTitle>
          <NextActionsPanel actions={nextActions} />
        </div>

        {/* Evolução do score */}
        <Card variant="dark" padding="sm">
          <SectionTitle>Evolução do score</SectionTitle>
          <ScoreChart data={scoreHistory} />
        </Card>
      </div>

      {/* Linha 4: Histórico de otimizações */}
      <div>
        <SectionTitle>Histórico de otimizações</SectionTitle>
        <OptimizationHistory actions={data.recentActions} />
      </div>

    </div>
  )
}
