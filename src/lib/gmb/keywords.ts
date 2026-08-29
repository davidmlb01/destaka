// =============================================================================
// DESTAKA — Google Business Profile: Search Keywords (Impressions)
// Docs: https://developers.google.com/my-business/reference/performance/rest/v1/locations.searchkeywords.impressions.monthly/list
// =============================================================================

const PERFORMANCE_URL = 'https://businessprofileperformance.googleapis.com/v1'

export interface SearchKeyword {
  keyword: string
  impressions: number
  month: string // "YYYY-MM"
}

interface MonthlySearchKeywordCount {
  searchKeyword?: string
  insightsValue?: {
    value?: string
    threshold?: string
  }
}

interface SearchKeywordsImpressionsMonthlyResponse {
  searchKeywordsCounts?: MonthlySearchKeywordCount[]
  nextPageToken?: string
}

/**
 * Busca keywords reais de busca que geraram impressões no perfil (últimos 3 meses).
 * Usa a Business Profile Performance API: searchkeywords/impressions/monthly.
 */
export async function getSearchKeywords(
  locationId: string,
  accessToken: string
): Promise<SearchKeyword[]> {
  const now = new Date()
  const endMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1)

  const params = new URLSearchParams({
    'monthlyRange.startMonth.year': String(startMonth.getFullYear()),
    'monthlyRange.startMonth.month': String(startMonth.getMonth() + 1),
    'monthlyRange.endMonth.year': String(endMonth.getFullYear()),
    'monthlyRange.endMonth.month': String(endMonth.getMonth() + 1),
  })

  const allKeywords: SearchKeyword[] = []
  let pageToken: string | undefined

  do {
    if (pageToken) params.set('pageToken', pageToken)

    const url = `${PERFORMANCE_URL}/${locationId}/searchkeywords/impressions/monthly?${params}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`GBP Keywords API ${res.status}: ${body}`)
    }

    const data = (await res.json()) as SearchKeywordsImpressionsMonthlyResponse

    for (const entry of data.searchKeywordsCounts ?? []) {
      if (!entry.searchKeyword) continue
      const impressions = parseInt(entry.insightsValue?.value ?? '0', 10) || 0
      allKeywords.push({
        keyword: entry.searchKeyword,
        impressions,
        month: `${endMonth.getFullYear()}-${String(endMonth.getMonth() + 1).padStart(2, '0')}`,
      })
    }

    pageToken = data.nextPageToken
  } while (pageToken)

  return allKeywords
}

/**
 * Agrupa keywords por nome, somando impressões de todos os meses,
 * e calcula a tendência (mês atual vs mês anterior).
 */
export interface AggregatedKeyword {
  keyword: string
  impressions: number
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
}

export function aggregateKeywords(raw: SearchKeyword[]): AggregatedKeyword[] {
  // Agrupa por keyword e mês
  const byKeyword = new Map<string, Map<string, number>>()

  for (const entry of raw) {
    if (!byKeyword.has(entry.keyword)) {
      byKeyword.set(entry.keyword, new Map())
    }
    const months = byKeyword.get(entry.keyword)!
    months.set(entry.month, (months.get(entry.month) ?? 0) + entry.impressions)
  }

  // Ordena meses para determinar "atual" vs "anterior"
  const allMonths = [...new Set(raw.map(r => r.month))].sort()
  const currentMonth = allMonths.at(-1)
  const previousMonth = allMonths.at(-2)

  const result: AggregatedKeyword[] = []

  for (const [keyword, months] of byKeyword) {
    const totalImpressions = [...months.values()].reduce((a, b) => a + b, 0)
    const current = currentMonth ? (months.get(currentMonth) ?? 0) : 0
    const previous = previousMonth ? (months.get(previousMonth) ?? 0) : 0

    let trend: 'up' | 'down' | 'stable' = 'stable'
    let trendPercent = 0

    if (previous > 0) {
      trendPercent = Math.round(((current - previous) / previous) * 100)
      if (trendPercent > 5) trend = 'up'
      else if (trendPercent < -5) trend = 'down'
    } else if (current > 0) {
      trend = 'up'
      trendPercent = 100
    }

    result.push({ keyword, impressions: totalImpressions, trend, trendPercent })
  }

  return result.sort((a, b) => b.impressions - a.impressions)
}
