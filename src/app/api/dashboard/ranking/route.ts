export const dynamic = 'force-dynamic'

import { getAuthOrg, privateJson } from '@/lib/api/with-auth'

export async function GET() {
  const auth = await getAuthOrg()
  if (auth.error) return auth.error
  const { orgId, supabase } = auth

  // Keywords com posicao mais recente
  const { data: keywords } = await supabase
    .from('ranking_keywords')
    .select('id, keyword, is_primary, source')
    .eq('organization_id', orgId)
    .order('is_primary', { ascending: false })

  if (!keywords?.length) {
    return privateJson({ empty: true, message: 'Keywords sendo geradas. Dados aparecem na proxima segunda.' })
  }

  // Posicoes mais recentes para cada keyword
  const keywordIds = keywords.map(k => k.id)
  const { data: positions } = await supabase
    .from('ranking_positions')
    .select('keyword_id, position, total_results, top_competitor_name, top_competitor_reviews, snapshot_date')
    .in('keyword_id', keywordIds)
    .order('snapshot_date', { ascending: false })

  // Agrupar: para cada keyword, pegar as ultimas 8 posicoes
  const positionsByKeyword = new Map<string, Array<{
    position: number | null
    date: string
    topCompetitor: string | null
    topCompetitorReviews: number | null
  }>>()

  for (const pos of positions ?? []) {
    const list = positionsByKeyword.get(pos.keyword_id) ?? []
    if (list.length < 8) {
      list.push({
        position: pos.position,
        date: pos.snapshot_date,
        topCompetitor: pos.top_competitor_name,
        topCompetitorReviews: pos.top_competitor_reviews,
      })
    }
    positionsByKeyword.set(pos.keyword_id, list)
  }

  const result = keywords.map(kw => {
    const history = positionsByKeyword.get(kw.id) ?? []
    const current = history[0] ?? null
    const previous = history[1] ?? null
    const delta = current?.position && previous?.position
      ? previous.position - current.position // positivo = subiu
      : null

    return {
      keyword: kw.keyword,
      isPrimary: kw.is_primary,
      currentPosition: current?.position ?? null,
      previousPosition: previous?.position ?? null,
      delta,
      topCompetitor: current?.topCompetitor ?? null,
      topCompetitorReviews: current?.topCompetitorReviews ?? null,
      history: history.reverse(), // cronologico
    }
  })

  // Keyword primaria no topo
  const primary = result.find(r => r.isPrimary)

  return privateJson({
    primary,
    keywords: result,
    lastTracked: positions?.[0]?.snapshot_date ?? null,
  })
}
