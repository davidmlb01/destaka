import { createClient as createAdminSupa } from '@supabase/supabase-js'

function adminClient() {
  return createAdminSupa(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getDashboardData(orgId: string) {
  const db = adminClient()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    { data: org },
    { data: latestScore },
    { data: scoreHistory },
    { data: gbpProfile },
    { data: recentPosts },
    { data: recentResponses },
  ] = await Promise.all([
    db.from('organizations').select('name, specialty, gbp_location_id').eq('id', orgId).maybeSingle(),
    db.from('scores').select('*').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
    db.from('scores').select('total, snapshot_date, faixa').eq('organization_id', orgId).order('snapshot_date', { ascending: false }).limit(30),
    db.from('gbp_profiles').select('id, description, categories, photo_count, audit_report, benchmark_report, optimization_report, last_synced_at').eq('organization_id', orgId).maybeSingle(),
    db.from('posts').select('id, published_at').eq('organization_id', orgId).eq('status', 'published').gte('published_at', sevenDaysAgo.toISOString()),
    db.from('review_responses').select('id, published_at').eq('organization_id', orgId).eq('status', 'published').gte('published_at', sevenDaysAgo.toISOString()),
  ])

  const profileBase = {
    id: gbpProfile?.id ?? orgId,
    name: org?.name ?? 'Meu Perfil',
    address: '',
    last_synced_at: (gbpProfile as Record<string, unknown> | null)?.last_synced_at ?? latestScore?.snapshot_date ?? null,
  }

  const auditReport = gbpProfile?.audit_report as Record<string, unknown> | null
  const issues: Array<{ field: string; severity: string; message: string; impact: number }> = []

  if (auditReport && typeof auditReport === 'object') {
    const auditIssues = (auditReport as { issues?: Array<{ field: string; severity: string; message: string; impact: number }> }).issues
    if (Array.isArray(auditIssues)) {
      issues.push(...auditIssues)
    }
  }

  const s = latestScore as Record<string, unknown> | null
  const details = s?.details as Record<string, Record<string, number>> | null

  const thirtyDaysAgoScore = new Date()
  thirtyDaysAgoScore.setDate(thirtyDaysAgoScore.getDate() - 30)

  const [
    postsResult,
    responsesResult,
    { data: totalReviewsData },
    { data: orgServices },
  ] = await Promise.all([
    db.from('posts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'published').gte('published_at', thirtyDaysAgoScore.toISOString()),
    db.from('review_responses').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'published'),
    db.from('organizations').select('google_review_count').eq('id', orgId).maybeSingle(),
    db.from('organizations').select('services').eq('id', orgId).maybeSingle(),
  ])

  const realPostCount = postsResult.count ?? 0
  let scorePostsReal = 0
  if (realPostCount >= 4) scorePostsReal = 10
  else if (realPostCount >= 2) scorePostsReal = 5
  else if (realPostCount >= 1) scorePostsReal = 2

  const services = (orgServices?.services as string[] | null) ?? []
  let scoreServicosReal = 0
  if (services.length >= 3) scoreServicosReal += 5
  scoreServicosReal += details?.services?.services_desc ?? 0

  const scoreAtributosReal = details?.attributes?.attributes ?? Math.min((s?.conversao as number) ?? 0, 5)

  const catInfoBasica = Math.min((s?.gmb_completude as number) ?? 0, 25)
  const catFotos = Math.min((gbpProfile?.photo_count ?? 0) * 2, 20)
  const catAvaliacoes = (s?.reputacao as number) ?? 0
  const catPosts = Math.min(scorePostsReal, 15)
  const catServicos = Math.min(scoreServicosReal, 10)
  const catAtributos = Math.min(scoreAtributosReal, 5)

  const computedTotal = catInfoBasica + catFotos + catAvaliacoes + catPosts + catServicos + catAtributos

  const diagnostic = latestScore ? {
    id: (s?.id as string) ?? '',
    score_total: computedTotal,
    score_info_basica: catInfoBasica,
    score_fotos: catFotos,
    score_avaliacoes: catAvaliacoes,
    score_posts: catPosts,
    score_servicos: catServicos,
    score_atributos: catAtributos,
    issues,
  } : null

  const profileData = { ...profileBase, score: computedTotal }

  const mappedScoreHistory = (scoreHistory ?? []).map((sc: Record<string, unknown>) => ({
    score_total: (sc.total as number) ?? 0,
    created_at: (sc.snapshot_date as string) ?? '',
  }))

  let metrics = {
    viewsSearch: 0,
    viewsMaps: 0,
    clicksWebsite: 0,
    clicksCall: 0,
    clicksDirections: 0,
    period: 'Últimas 4 semanas',
    source: 'none' as 'database' | 'none',
  }

  {
    const { data: perfRows } = await db
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

  if (metrics.source === 'none') {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: gmbProfileLegacy } = await db
      .from('gmb_profiles')
      .select('id')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (gmbProfileLegacy?.id) {
      const { data: metricRows } = await db
        .from('gmb_metrics')
        .select('views_search, views_maps, clicks_website, clicks_call, clicks_directions')
        .eq('profile_id', gmbProfileLegacy.id)
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

  const fallbackActions: Array<{ field: string; severity: string; message: string; impact: number }> = []

  if (!issues.some(i => i.field === 'description') && (!gbpProfile?.description || (gbpProfile.description as string).length < 10)) {
    fallbackActions.push({ field: 'description', severity: 'critical', message: 'Seu perfil não tem descrição. Isso reduz sua visibilidade nas buscas.', impact: 8 })
  }
  if (!issues.some(i => i.field === 'photos') && (gbpProfile?.photo_count ?? 0) < 5) {
    fallbackActions.push({ field: 'photos', severity: 'warning', message: 'Adicione pelo menos 5 fotos reais do seu espaço para aumentar a confiança.', impact: 6 })
  }

  const optimReport = gbpProfile?.optimization_report as Record<string, unknown> | null
  const appliedSections = Array.isArray(optimReport?.applied_sections) ? optimReport.applied_sections as string[] : []
  const appliedFieldMap: Record<string, string[]> = {
    attributes: ['attributes', 'atributos'],
    categories: ['category', 'categories', 'categorias'],
    description: ['description', 'descricao'],
    services: ['services', 'services_count', 'services_desc', 'servicos'],
  }
  const appliedFields = appliedSections.flatMap(sf => appliedFieldMap[sf] ?? [])

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

  const recentActions: Array<{ id: string; type: string; status: string; created_at: string }> = []

  const postsPublished = recentPosts?.length ?? 0
  const reviewsReplied = recentResponses?.length ?? 0
  const scoreDelta = mappedScoreHistory.length >= 2
    ? mappedScoreHistory[0].score_total - mappedScoreHistory[1].score_total
    : 0

  const weeklySummary = (postsPublished > 0 || reviewsReplied > 0 || scoreDelta !== 0)
    ? { posts_published: postsPublished, reviews_replied: reviewsReplied, score_delta: scoreDelta }
    : null

  return {
    profile: profileData,
    diagnostic,
    scoreHistory: mappedScoreHistory,
    recentActions,
    metrics,
    nextActions,
    weeklySummary,
    specialty: (org?.specialty as string) ?? null,
  }
}
