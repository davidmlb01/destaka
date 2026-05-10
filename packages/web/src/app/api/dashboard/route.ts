import { NextResponse } from 'next/server'
import { getAuthenticatedProfile } from '@/lib/api/with-auth'
import { trackEvent, upsertSession } from '@/lib/analytics'
import { getGmbMetrics, type GmbMetrics } from '@/lib/gmb/client'
import { getValidGmbToken } from '@/lib/gmb/auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET /api/dashboard
// Agrega todos os dados necessários para o dashboard principal.
export async function GET() {
  const auth = await getAuthenticatedProfile('*')
  if (auth.error) return auth.error

  const { user, profile, serviceClient } = auth

  // Engagement: score_viewed (one-time) + session (churn prevention)
  trackEvent(serviceClient, user.id, 'score_viewed', { profileId: profile.id })
  upsertSession(serviceClient, user.id)

  // Diagnóstico mais recente
  const { data: diagnostic } = await serviceClient
    .from('diagnostics')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Histórico de scores (últimos 30 diagnósticos para o gráfico)
  const { data: scoreHistory } = await serviceClient
    .from('diagnostics')
    .select('score_total, created_at')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: true })
    .limit(30)

  // Últimas ações de otimização
  const { data: recentActions } = await serviceClient
    .from('optimization_actions')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Métricas do GMB: real em produção, mock em dev
  let metrics: GmbMetrics
  if (process.env.NODE_ENV === 'development' && process.env.GMB_MOCK === 'true') {
    metrics = { viewsSearch: 847, viewsMaps: 312, clicksWebsite: 43, clicksCall: 28, clicksDirections: 19, period: 'Últimos 30 dias' }
  } else {
    try {
      const accessToken = await getValidGmbToken(user.id).catch(() => null)

      if (accessToken && profile.google_location_id) {
        // google_location_id = "accounts/{id}/locations/{id}"
        // getGmbMetrics espera "locations/{id}" — extrair os últimos 2 segmentos
        const parts = profile.google_location_id.split('/')
        const locationPath = parts.length >= 2 ? parts.slice(-2).join('/') : profile.google_location_id
        metrics = await getGmbMetrics(accessToken, locationPath)
      } else {
        metrics = { viewsSearch: 0, viewsMaps: 0, clicksWebsite: 0, clicksCall: 0, clicksDirections: 0, period: 'Últimos 30 dias' }
      }
    } catch (err) {
      logger.error('dashboard', 'erro ao buscar métricas GMB', { userId: user.id, err: String(err) })
      metrics = { viewsSearch: 0, viewsMaps: 0, clicksWebsite: 0, clicksCall: 0, clicksDirections: 0, period: 'Últimos 30 dias' }
    }
  }

  // Próximas ações (derivadas dos issues do diagnóstico)
  const nextActions = diagnostic
    ? getNextActions(diagnostic.issues ?? [])
    : []

  return NextResponse.json({
    profile,
    diagnostic,
    scoreHistory: scoreHistory ?? [],
    recentActions: recentActions ?? [],
    metrics,
    nextActions,
  })
}

function getNextActions(issues: Array<{ field: string; severity: string; message: string; impact: number }>) {
  return issues
    .filter(i => i.severity === 'critical' || i.severity === 'warning')
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map(i => ({
      field: i.field,
      message: i.message,
      impact: i.impact,
      severity: i.severity,
    }))
}
