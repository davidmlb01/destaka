export const dynamic = 'force-dynamic'

// API de dados do dashboard, retorna o shape esperado por useDashboard
import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { createClient as createAdminSupa } from '@supabase/supabase-js'
import { GBPClient } from '@/lib/google/gbp-client'
import { getValidGmbToken } from '@/lib/gmb/auth'

function adminClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { user, orgId, supabase } = auth
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
    supabase.from('organizations').select('name, specialty, gbp_location_id').eq('id', orgId).maybeSingle(),
    supabase.from('scores').select('*').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('scores').select('total, snapshot_date, faixa').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(30),
    supabase.from('gbp_profiles').select('id, description, categories, photo_count, audit_report, benchmark_report, optimization_report, last_synced_at').eq('organization_id', orgId).maybeSingle(),
    supabase.from('posts').select('id, published_at').eq('organization_id', orgId).eq('status', 'published').gte('published_at', sevenDaysAgo.toISOString()),
    adminClient().from('review_responses').select('id, published_at').eq('organization_id', orgId).eq('status', 'published').gte('published_at', sevenDaysAgo.toISOString()),
  ])

  // Construir o profile no formato esperado pelo useDashboard
  const profileData = {
    id: gbpProfile?.id ?? orgId,
    name: org?.name ?? 'Meu Perfil',
    address: '',
    score: latestScore?.total ?? 0,
    last_synced_at: (gbpProfile as Record<string, unknown> | null)?.last_synced_at ?? latestScore?.snapshot_date ?? null,
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
    score_info_basica: Math.min((s?.gmb_completude as number) ?? 0, 25),
    score_fotos: Math.min((gbpProfile?.photo_count ?? 0) * 2, 20),
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

  // Metrics: buscar da GBP Performance API (real), fallback para gmb_metrics (banco)
  let metrics = {
    viewsSearch: 0,
    viewsMaps: 0,
    clicksWebsite: 0,
    clicksCall: 0,
    clicksDirections: 0,
    period: 'Últimos 30 dias',
    source: 'none' as 'api' | 'database' | 'none',
  }

  const locationName = (org as Record<string, unknown>)?.gbp_location_id as string | undefined

  // Tentar API real primeiro
  if (locationName) {
    try {
      const accessToken = await getValidGmbToken(user.id)
      const gbpClient = new GBPClient(accessToken)
      const perfData = await gbpClient.getPerformanceMetrics(locationName)

      if (perfData.metricValues?.length) {
        for (const mv of perfData.metricValues) {
          const total = mv.dimensionalValues?.reduce(
            (sum, dv) => sum + (parseInt(dv.value, 10) || 0), 0
          ) ?? (mv.totalValue ? parseInt(String(mv.totalValue.metricOption), 10) || 0 : 0)

          const metric = mv.metric?.toUpperCase() ?? ''
          if (metric.includes('SEARCH') && metric.includes('IMPRESSION')) metrics.viewsSearch = total
          else if (metric.includes('MAPS') && metric.includes('IMPRESSION')) metrics.viewsMaps = total
          else if (metric.includes('WEBSITE')) metrics.clicksWebsite = total
          else if (metric.includes('CALL')) metrics.clicksCall = total
          else if (metric.includes('DIRECTION')) metrics.clicksDirections = total
        }
        // Só marca como 'api' se extraiu algum valor real; senão cai no fallback do banco
        const apiTotal = metrics.viewsSearch + metrics.viewsMaps + metrics.clicksWebsite + metrics.clicksCall + metrics.clicksDirections
        if (apiTotal > 0) {
          metrics.source = 'api'
        }
      }
    } catch {
      // API falhou, cai no fallback abaixo
    }
  }

  // Fallback 1: performance_metrics (coletado pelo performance-collector cron)
  // Usa admin client porque performance_metrics pode nao ter RLS para user
  if (metrics.source === 'none') {
    const { data: perfRows } = await adminClient()
      .from('performance_metrics')
      .select('views_search, views_maps, actions_website, actions_phone, actions_directions, week_start')
      .eq('organization_id', orgId)
      .order('week_start', { ascending: false })
      .limit(4)

    if (perfRows?.length) {
      metrics = {
        viewsSearch: perfRows.reduce((sum, r) => sum + ((r as Record<string, number>).views_search ?? 0), 0),
        viewsMaps: perfRows.reduce((sum, r) => sum + ((r as Record<string, number>).views_maps ?? 0), 0),
        clicksWebsite: perfRows.reduce((sum, r) => sum + ((r as Record<string, number>).actions_website ?? 0), 0),
        clicksCall: perfRows.reduce((sum, r) => sum + ((r as Record<string, number>).actions_phone ?? 0), 0),
        clicksDirections: perfRows.reduce((sum, r) => sum + ((r as Record<string, number>).actions_directions ?? 0), 0),
        period: `Últimas ${perfRows.length} semanas`,
        source: 'database',
      }

      // Calcular deltas: semana atual vs semana anterior
      if (perfRows.length >= 2) {
        const curr = perfRows[0] as Record<string, number>
        const prev = perfRows[1] as Record<string, number>
        const pct = (c: number, p: number) => p > 0 ? ((c - p) / p) * 100 : null
        ;(metrics as Record<string, unknown>).deltas = {
          viewsSearch: pct(curr.views_search ?? 0, prev.views_search ?? 0),
          viewsMaps: pct(curr.views_maps ?? 0, prev.views_maps ?? 0),
          clicksWebsite: pct(curr.actions_website ?? 0, prev.actions_website ?? 0),
          clicksCall: pct(curr.actions_phone ?? 0, prev.actions_phone ?? 0),
        }
      }
    }
  }

  // Fallback 2: gmb_metrics (dados historicos legados)
  if (metrics.source === 'none') {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: gmbProfile } = await supabase
      .from('gmb_profiles')
      .select('id')
      .eq('organization_id', orgId)
      .maybeSingle()

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
          period: 'Últimos 30 dias',
          source: 'database',
        }
      }
    }
  }

  // Next actions: apenas issues reais do audit_report (dados verificados do perfil GBP)
  // Fallbacks baseados em score removidos porque mostram itens já feitos pelo usuário
  const fallbackActions: Array<{ field: string; severity: string; message: string; impact: number }> = []

  // Apenas fallback para descrição vazia (verificável sem score)
  if (!issues.some(i => i.field === 'description') && (!gbpProfile?.description || (gbpProfile.description as string).length < 10)) {
    fallbackActions.push({ field: 'description', severity: 'critical', message: 'Seu perfil não tem descrição. Isso reduz sua visibilidade nas buscas.', impact: 8 })
  }
  // Apenas fallback para fotos insuficientes (verificável sem score)
  if (!issues.some(i => i.field === 'photos') && (gbpProfile?.photo_count ?? 0) < 5) {
    fallbackActions.push({ field: 'photos', severity: 'warning', message: 'Adicione pelo menos 5 fotos reais do seu espaço para aumentar a confiança.', impact: 6 })
  }

  // Filtrar ações já aplicadas via otimizações
  const optimReport = gbpProfile?.optimization_report as Record<string, unknown> | null
  const appliedSections = Array.isArray(optimReport?.applied_sections) ? optimReport.applied_sections as string[] : []
  const appliedFieldMap: Record<string, string[]> = {
    attributes: ['attributes', 'atributos'],
    categories: ['category', 'categories', 'categorias'],
    description: ['description', 'descricao'],
    services: ['services', 'services_count', 'services_desc', 'servicos'],
  }
  const appliedFields = appliedSections.flatMap(s => appliedFieldMap[s] ?? [])

  const nextActions = [...issues, ...fallbackActions]
    .filter(a => !appliedFields.includes(a.field))
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

  return privateJson({
    profile: profileData,
    diagnostic,
    scoreHistory: mappedScoreHistory,
    recentActions,
    metrics,
    nextActions,
    weeklySummary,
    specialty: (org?.specialty as string) ?? null,
  })
}
