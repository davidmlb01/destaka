// API de dados do dashboard, retorna o shape esperado por useDashboard
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professional?.organization_id) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  const orgId = professional.organization_id
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Busca paralela de todos os dados
  const [
    { data: org },
    { data: latestScore },
    { data: scoreHistory },
    { data: gbpProfile },
    { data: recentPosts },
    { data: recentResponses },
  ] = await Promise.all([
    supabase.from('organizations').select('name, specialty').eq('id', orgId).single(),
    supabase.from('scores').select('*').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('scores').select('total, snapshot_date, faixa').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(30),
    supabase.from('gbp_profiles').select('id, description, categories, photo_count, audit_report, benchmark_report, optimization_report').eq('organization_id', orgId).maybeSingle(),
    supabase.from('posts').select('id, published_at').eq('organization_id', orgId).eq('status', 'published').gte('published_at', sevenDaysAgo.toISOString()),
    supabase.from('review_responses').select('id, created_at').eq('organization_id', orgId).eq('status', 'published').gte('created_at', sevenDaysAgo.toISOString()),
  ])

  // Construir o profile no formato esperado pelo useDashboard
  const profileData = {
    id: gbpProfile?.id ?? orgId,
    name: org?.name ?? 'Meu Perfil',
    address: '',
    score: latestScore?.total ?? 0,
    last_synced_at: latestScore?.snapshot_date ?? null,
  }

  // Construir diagnostic a partir do score e audit_report
  const auditReport = gbpProfile?.audit_report as Record<string, unknown> | null
  const issues: Array<{ field: string; severity: string; message: string; impact: number }> = []

  if (auditReport && typeof auditReport === 'object') {
    const auditIssues = (auditReport as { issues?: Array<{ field: string; severity: string; message: string; impact: number }> }).issues
    if (Array.isArray(auditIssues)) {
      issues.push(...auditIssues)
    }
  }

  // Mapear colunas reais do score (gmb_completude, reputacao, etc.) para o formato do dashboard
  const s = latestScore as Record<string, unknown> | null
  const diagnostic = latestScore ? {
    id: (s?.id as string) ?? '',
    score_total: (s?.total as number) ?? 0,
    score_info_basica: (s?.gmb_completude as number) ?? 0,
    score_fotos: Math.round(((s?.gmb_completude as number) ?? 0) * 0.8),
    score_avaliacoes: (s?.reputacao as number) ?? 0,
    score_posts: (s?.visibilidade as number) ?? 0,
    score_servicos: (s?.retencao as number) ?? 0,
    score_atributos: (s?.conversao as number) ?? 0,
    issues,
  } : null

  // Score history no formato esperado
  const mappedScoreHistory = (scoreHistory ?? []).map((s: Record<string, unknown>) => ({
    score_total: (s.total as number) ?? 0,
    created_at: (s.snapshot_date as string) ?? '',
  }))

  // Metrics: somar gmb_metrics dos ultimos 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Buscar metricas via gmb_profiles (user_id) -> gmb_metrics (profile_id)
  const { data: gmbProfile } = await supabase
    .from('gmb_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  let metrics = {
    viewsSearch: 0,
    viewsMaps: 0,
    clicksWebsite: 0,
    clicksCall: 0,
    clicksDirections: 0,
    period: 'Ultimos 30 dias',
  }

  if (gmbProfile?.id) {
    const { data: metricRows } = await supabase
      .from('gmb_metrics')
      .select('views_search, views_maps, clicks_website, clicks_call, clicks_directions')
      .eq('profile_id', gmbProfile.id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

    if (metricRows?.length) {
      metrics = {
        viewsSearch: metricRows.reduce((sum, r) => sum + ((r as Record<string, number>).views_search ?? 0), 0),
        viewsMaps: metricRows.reduce((sum, r) => sum + ((r as Record<string, number>).views_maps ?? 0), 0),
        clicksWebsite: metricRows.reduce((sum, r) => sum + ((r as Record<string, number>).clicks_website ?? 0), 0),
        clicksCall: metricRows.reduce((sum, r) => sum + ((r as Record<string, number>).clicks_call ?? 0), 0),
        clicksDirections: metricRows.reduce((sum, r) => sum + ((r as Record<string, number>).clicks_directions ?? 0), 0),
        period: 'Ultimos 30 dias',
      }
    }
  }

  // Next actions: derivadas das issues do audit_report
  const nextActions = issues
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5)
    .map(i => ({
      field: i.field,
      message: i.message,
      impact: i.impact,
      severity: i.severity,
    }))

  // Recent actions: vazio por enquanto (optimization_actions pode ser populado)
  const recentActions: Array<{ id: string; type: string; status: string; created_at: string }> = []

  // Weekly summary
  const postsPublished = recentPosts?.length ?? 0
  const reviewsReplied = recentResponses?.length ?? 0
  const scoreDelta = mappedScoreHistory.length >= 2
    ? mappedScoreHistory[0].score_total - mappedScoreHistory[1].score_total
    : 0

  const weeklySummary = (postsPublished > 0 || reviewsReplied > 0 || scoreDelta !== 0)
    ? { posts_published: postsPublished, reviews_replied: reviewsReplied, score_delta: scoreDelta }
    : null

  return NextResponse.json({
    profile: profileData,
    diagnostic,
    scoreHistory: mappedScoreHistory,
    recentActions,
    metrics,
    nextActions,
    weeklySummary,
  })
}
