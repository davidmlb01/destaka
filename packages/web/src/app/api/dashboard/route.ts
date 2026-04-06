import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/dashboard
// Agrega todos os dados necessários para o dashboard principal.
export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const serviceClient = await createServiceClient()

  // Perfil principal
  const { data: profile } = await serviceClient
    .from('gmb_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Nenhum perfil conectado' }, { status: 404 })
  }

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

  // Métricas do GMB (mock em dev, real via API em produção)
  const metrics = getMockMetrics()

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

function getMockMetrics() {
  return {
    viewsSearch: 847,
    viewsMaps: 312,
    clicksWebsite: 43,
    clicksCall: 28,
    clicksDirections: 19,
    period: 'Últimos 30 dias',
  }
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
