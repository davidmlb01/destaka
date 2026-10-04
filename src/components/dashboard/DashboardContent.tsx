'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { ScoreGauge } from './ScoreGauge'
import { ScoreCard } from './ScoreCard'
import { MetricCard } from './MetricCard'
import { NextActionsPanel } from './NextActionsPanel'
import dynamic from 'next/dynamic'
const ScoreChart = dynamic(() => import('./ScoreChart').then(m => m.ScoreChart), { ssr: false, loading: () => <div className="h-[200px]" /> })
import { OptimizationWizard } from './OptimizationWizard'
import { ProfileAlerts } from './ProfileAlerts'
import { PendingDescriptionBanner } from './PendingDescriptionBanner'
import { TokenInvalidBanner } from './TokenInvalidBanner'
import { WeeklyHighlights } from './WeeklyHighlights'
import { DashboardSkeleton } from './Skeletons'
import { PinIcon } from '@/components/ui/PinIcon'
import { useDashboard, type DashboardData } from './hooks/useDashboard'
import MapCard from './MapCard'
import KeywordInsightCard from './KeywordInsightCard'

const CATEGORY_LABELS: Record<string, string> = {
  'Informações Básicas': 'Seu perfil está completo?',
  'Fotos': 'Fotos do seu negócio',
  'Avaliações': 'O que seus clientes dizem',
  'Posts': 'Suas novidades no Google',
  'Serviços': 'Serviços que você oferece',
  'Atributos': 'Recursos do seu negócio',
}

function getScoreMessage(score: number, isSubscriber: boolean): string {
  if (!isSubscriber) {
    if (score <= 30) return 'Seu perfil precisa de atenção para aparecer'
    if (score <= 60) return 'Clientes procuram, mas não te encontram'
    if (score <= 80) return 'Quase lá. Alguns ajustes fazem diferença'
    return 'Bem posicionado'
  }
  if (score <= 30) return 'Precisa de atenção urgente'
  if (score <= 60) return 'Em progresso'
  if (score <= 80) return 'Bom, pode melhorar'
  return 'Excelente'
}

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

function LockedOverlay({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative">
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.7 }}>
        {children}
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center rounded-2xl"
        style={{ background: 'rgba(7,26,25,0.4)', backdropFilter: 'blur(1px)' }}
      >
        <div className="text-center px-4">
          <svg className="mx-auto mb-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-sm font-medium text-white">{label}</p>
        </div>
      </div>
    </div>
  )
}

interface DashboardContentProps {
  isSubscriber?: boolean
  onCheckout?: () => void
  impactText?: string
  initialData?: DashboardData
}

export function DashboardContent({ isSubscriber = true, onCheckout, impactText, initialData }: DashboardContentProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const {
    data,
    error,
    isLoading,
    mutate,
    syncing,
    syncError,
    diagnosticId,
    categories,
    lastSync,
    handleSync,
  } = useDashboard(initialData)

  if (isLoading) return <DashboardSkeleton />

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="mb-4" style={{ opacity: 0.3 }}><PinIcon size={48} /></div>
      <h2 className="font-display font-bold text-white text-[20px] mb-2">
        Não foi possível carregar o painel
      </h2>
      <p className="text-[14px] mb-6" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 400 }}>
        Houve um problema ao conectar com o servidor. Verifique sua conexão e tente novamente.
      </p>
      <button
        onClick={() => mutate()}
        className="px-6 py-3 rounded-lg font-display font-semibold text-[14px] transition-all hover:brightness-110 cursor-pointer"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        Tentar novamente
      </button>
    </div>
  )

  const { profile, diagnostic, scoreHistory, metrics, nextActions, weeklySummary } = data

  return (
    <ErrorBoundary>
    <div className="flex flex-col gap-8">

      {isSubscriber && <WeeklyHighlights data={weeklySummary} />}
      {isSubscriber && <TokenInvalidBanner />}
      {isSubscriber && <ProfileAlerts />}
      {isSubscriber && <PendingDescriptionBanner />}

      {/* ===== NIVEL 1: Hero (Score + Mapa) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">

        {/* Score gauge */}
        <div
          className="rounded-2xl p-6 flex flex-col items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ScoreGauge score={diagnostic?.score_total ?? 0} />
          <p className={`text-sm ${isSubscriber ? 'text-zinc-400' : 'text-amber-400 font-medium'}`}>{getScoreMessage(diagnostic?.score_total ?? 0, isSubscriber)}</p>

          {isSubscriber ? (
            <>
              <OptimizationWizard
                profileId={profile.id}
                diagnosticId={diagnosticId}
                onComplete={() => mutate()}
              />
              <div className="w-full flex flex-col gap-1">
                {syncError && (
                  <p className="text-xs font-medium text-center" style={{ color: '#F87171' }}>{syncError}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Sync: {lastSync}
                  </p>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer"
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
            </>
          ) : (
            <>
              {impactText && (
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-white">{impactText.split('|')[0]}</p>
                  {impactText.split('|')[1] && (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{impactText.split('|')[1]}</p>
                  )}
                </div>
              )}
              <button
                onClick={onCheckout}
                className="w-full px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:scale-[1.02]"
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
                }}
              >
                Aparecer no Google
              </button>
            </>
          )}
        </div>

        {/* Mapa de posicionamento */}
        <MapCard isSubscriber={isSubscriber} />
      </div>

      {/* ===== NIVEL 2: Metricas com tendencia ===== */}
      {isSubscriber ? (
        <div className="animate-fade-in-up stagger-1">
          <SectionTitle>Performance</SectionTitle>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Buscas no Google" value={metrics.viewsSearch} icon={<PinIcon size={16} />} hint={metrics.period} />
            <MetricCard label="Visualizações no Maps" value={metrics.viewsMaps} icon={<PinIcon size={16} />} hint={metrics.period} />
            <MetricCard label="Cliques no site" value={metrics.clicksWebsite} icon={<PinIcon size={16} />} hint={metrics.period} />
            <MetricCard label="Ligações geradas" value={metrics.clicksCall} icon={<PinIcon size={16} />} hint={metrics.period} />
          </div>
        </div>
      ) : (
        <div>
          <SectionTitle>Performance</SectionTitle>
          <LockedOverlay label="Pessoas te procuraram e não te encontraram. Veja quantas.">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard label="Buscas no Google" value={metrics.viewsSearch} icon={<PinIcon size={16} />} hint={metrics.period} />
              <MetricCard label="Visualizações no Maps" value={metrics.viewsMaps} icon={<PinIcon size={16} />} hint={metrics.period} />
              <MetricCard label="Cliques no site" value={metrics.clicksWebsite} icon={<PinIcon size={16} />} hint={metrics.period} />
              <MetricCard label="Ligações geradas" value={metrics.clicksCall} icon={<PinIcon size={16} />} hint={metrics.period} />
            </div>
          </LockedOverlay>
        </div>
      )}

      {/* ===== NIVEL 3: Insights (Keywords + Acoes) ===== */}
      {isSubscriber ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up stagger-2">
          <KeywordInsightCard isSubscriber={true} />
          <div>
            <SectionTitle>Próximas ações</SectionTitle>
            <NextActionsPanel actions={nextActions} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KeywordInsightCard isSubscriber={false} />
          <div>
            <SectionTitle>Próximas ações</SectionTitle>
            <LockedOverlay label={`${nextActions.length} ajustes que fariam você aparecer para mais clientes.`}>
              <NextActionsPanel actions={nextActions} />
            </LockedOverlay>
          </div>
        </div>
      )}

      {/* ===== NIVEL 4: Categorias do score (colapsavel) + Grafico ===== */}
      <div className="animate-fade-in-up stagger-3">
        <button
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between mb-4 group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <p
              className="text-xs font-bold tracking-[0.12em] uppercase"
              style={{ color: 'rgba(255,255,255,0.38)' }}
            >
              Detalhes do score
            </p>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors ml-3">
            {categoriesOpen ? '▲ ocultar' : '▼ expandir'}
          </span>
        </button>

        {categoriesOpen && (
          <>
            {isSubscriber ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {categories.map(cat => (
                  <ScoreCard
                    key={cat.name}
                    category={{
                      ...cat,
                      label: CATEGORY_LABELS[cat.label] ?? cat.label,
                    }}
                  />
                ))}
              </div>
            ) : (
              <LockedOverlay label={`${categories.length} pontos fracos identificados. Veja o que corrigir.`}>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {categories.map(cat => (
                    <ScoreCard
                      key={cat.name}
                      category={{
                        ...cat,
                        label: CATEGORY_LABELS[cat.label] ?? cat.label,
                      }}
                    />
                  ))}
                </div>
              </LockedOverlay>
            )}

            {isSubscriber && (
              <Card variant="dark" padding="sm">
                <SectionTitle>Evolução do score</SectionTitle>
                <ScoreChart data={scoreHistory} />
              </Card>
            )}
          </>
        )}
      </div>

    </div>
    </ErrorBoundary>
  )
}
