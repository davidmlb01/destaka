export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'
import { isActiveSubscriber } from '@/lib/subscription'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  // Paywall: nao-assinantes recebem flag, nao dados completos
  const subscribed = await isActiveSubscriber(orgId)
  if (!subscribed) {
    return privateJson({ paywall: true })
  }

  // Buscar keywords ordenadas por semana e impressoes
  const { data: allKeywords } = await supabase
    .from('keyword_snapshots')
    .select('keyword, impressions, clicks, week_start')
    .eq('org_id', orgId)
    .order('week_start', { ascending: false })
    .order('impressions', { ascending: false })
    .limit(100)

  if (!allKeywords?.length) {
    return privateJson({
      empty: true,
      message: 'Coletando dados da primeira semana...',
    })
  }

  // Separar semana atual e anterior
  const currentWeek = allKeywords[0].week_start
  const currentKeywords = allKeywords.filter(k => k.week_start === currentWeek)

  const prevWeekCandidates = allKeywords.filter(k => k.week_start < currentWeek)
  const prevWeekStart = prevWeekCandidates[0]?.week_start ?? null
  const prevKeywords = prevWeekStart
    ? prevWeekCandidates.filter(k => k.week_start === prevWeekStart)
    : []

  // Totais
  const totalSearches = currentKeywords.reduce((sum, k) => sum + (k.impressions ?? 0), 0)
  const prevTotal = prevKeywords.reduce((sum, k) => sum + (k.impressions ?? 0), 0)

  // Tendencia
  const trendPct = prevTotal > 0
    ? Math.round(((totalSearches - prevTotal) / prevTotal) * 1000) / 10
    : null

  // Keywords da semana anterior (set para detectar novas)
  const prevKeywordSet = new Set(prevKeywords.map(k => k.keyword))

  // Top 5
  const top5 = currentKeywords.slice(0, 5).map(k => ({
    keyword: k.keyword,
    impressions: k.impressions ?? 0,
    clicks: k.clicks ?? 0,
    is_new: prevKeywords.length > 0 ? !prevKeywordSet.has(k.keyword) : false,
  }))

  const otherCount = Math.max(0, currentKeywords.length - 5)

  // Oportunidade competitiva
  let opportunity: { keyword: string; source: string } | null = null

  const { data: analysis } = await supabase
    .from('competitive_analyses')
    .select('analysis_data')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (analysis?.analysis_data) {
    const analysisData = analysis.analysis_data as {
      gaps?: Array<{ type?: string; items?: string[] }>
      keyword_gaps?: string[]
    }

    const keywordGaps = analysisData.keyword_gaps
      ?? analysisData.gaps?.find(g => g.type === 'keywords')?.items
      ?? []

    const currentKeywordSet = new Set(currentKeywords.map(k => k.keyword.toLowerCase()))
    const gap = keywordGaps.find(kw => !currentKeywordSet.has(kw.toLowerCase()))

    if (gap) {
      opportunity = { keyword: gap, source: 'competitor' }
    }
  }

  return privateJson({
    total_searches: totalSearches,
    trend_pct: trendPct,
    top_keywords: top5,
    other_count: otherCount,
    opportunity,
    week_start: currentWeek,
  })
}
