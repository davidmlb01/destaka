// Google Business Profile API client
// Docs: https://developers.google.com/my-business/reference/businessinformation/rest

export interface GBPLocation {
  name: string
  title: string
  categories?: {
    primaryCategory?: { displayName: string; name: string }
    additionalCategories?: Array<{ displayName: string; name: string }>
  }
  storefrontAddress?: {
    addressLines: string[]
    locality: string
    administrativeArea: string
    postalCode: string
    regionCode: string
  }
  phoneNumbers?: { primaryPhone: string }
  regularHours?: {
    periods: Array<{
      openDay: string
      openTime: { hours: number; minutes?: number }
      closeDay: string
      closeTime: { hours: number; minutes?: number }
    }>
  }
  profile?: { description: string }
  attributes?: Array<{ name: string; valueType: string; values: string[] }>
  serviceItems?: Array<{
    structuredServiceItem?: { serviceTypeId: string; description: string }
    freeFormServiceItem?: { category: string; label: { displayName: string; description: string } }
  }>
  metadata?: { mapsUri: string; newReviewUri: string }
}

export interface GBPReview {
  name: string
  reviewId: string
  reviewer: { profilePhotoUrl?: string; displayName: string; isAnonymous: boolean }
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'
  comment?: string
  createTime: string
  updateTime: string
  reviewReply?: { comment: string; updateTime: string }
}

export interface GBPMediaItem {
  name: string
  mediaFormat: string
  locationAssociation?: { category: string }
  createTime: string
}

const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
}

export interface GBPLocalPost {
  name?: string
  languageCode: string
  summary: string
  topicType: 'STANDARD' | 'EVENT' | 'OFFER' | 'ALERT'
  media?: { mediaFormat: 'PHOTO' | 'VIDEO'; sourceUrl: string }
  callToAction?: { actionType: string; url: string }
  state?: string
  createTime?: string
  updateTime?: string
}

export interface GBPPerformanceMetrics {
  searchKeywordsImpressions?: Array<{ searchKeyword: string; insightsValue: { value: string } }>
  metricValues?: Array<{
    metric: string
    totalValue?: { metricOption: string; timeDimension?: { timeRange: { startTime: string; endTime: string } } }
    dimensionalValues?: Array<{ value: string; timeDimension?: { timeRange: { startTime: string; endTime: string } } }>
  }>
}

export class GBPClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async fetch<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await globalThis.fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`GBP API error ${res.status}: ${body}`)
    }
    return res.json()
  }

  async listAccounts(): Promise<Array<{ name: string; accountName: string; type: string }>> {
    const data = await this.fetch<{ accounts?: Array<{ name: string; accountName: string; type: string }> }>(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'
    )
    return data.accounts ?? []
  }

  async listLocations(accountName: string): Promise<GBPLocation[]> {
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,categories,storefrontAddress,phoneNumbers,regularHours,profile,websiteUri,metadata,attributes,serviceItems`
    const data = await this.fetch<{ locations?: GBPLocation[] }>(url)
    return data.locations ?? []
  }

  async listReviews(locationName: string): Promise<GBPReview[]> {
    // Tenta GBP v4 primeiro (pode estar habilitada em alguns projetos)
    try {
      const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=50`
      const data = await this.fetch<{ reviews?: GBPReview[] }>(url)
      return data.reviews ?? []
    } catch {
      // GBP v4 descontinuada, retorna vazio (usar listReviewsViaPlaces como fallback)
      return []
    }
  }

  /**
   * Busca reviews via Places API (antiga) com API key.
   * Fallback para quando GBP v4 reviews está desabilitada.
   * Retorna no formato GBPReview para compatibilidade.
   */
  static async listReviewsViaPlaces(placeId: string): Promise<GBPReview[]> {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) return []

    const ratingMap: Record<number, GBPReview['starRating']> = {
      1: 'ONE', 2: 'TWO', 3: 'THREE', 4: 'FOUR', 5: 'FIVE',
    }

    // Busca com dois sorts para maximizar cobertura (5 newest + 5 most_relevant)
    const sorts = ['newest', 'most_relevant'] as const
    const allReviews: GBPReview[] = []
    const seenTimes = new Set<number>()

    for (const sort of sorts) {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=reviews&language=pt-BR&key=${apiKey}&reviews_sort=${sort}`
      try {
        const res = await globalThis.fetch(url)
        if (!res.ok) continue
        const data = await res.json() as {
          status: string
          result?: {
            reviews?: Array<{
              author_name: string
              rating: number
              text: string
              time: number
              profile_photo_url?: string
            }>
          }
        }
        if (data.status !== 'OK' || !data.result?.reviews) continue

        for (const r of data.result.reviews) {
          if (seenTimes.has(r.time)) continue
          seenTimes.add(r.time)
          allReviews.push({
            name: `places/${placeId}/reviews/${r.time}`,
            reviewId: `places_${placeId}_${r.time}`,
            reviewer: {
              displayName: r.author_name,
              profilePhotoUrl: r.profile_photo_url,
              isAnonymous: !r.author_name,
            },
            starRating: ratingMap[r.rating] ?? 'FIVE',
            comment: r.text ?? undefined,
            createTime: new Date(r.time * 1000).toISOString(),
            updateTime: new Date(r.time * 1000).toISOString(),
          })
        }
      } catch {
        continue
      }
    }

    return allReviews
  }

  async listMedia(locationName: string): Promise<GBPMediaItem[]> {
    const url = `https://mybusiness.googleapis.com/v4/${locationName}/media?pageSize=100`
    const data = await this.fetch<{ mediaItems?: GBPMediaItem[] }>(url)
    return data.mediaItems ?? []
  }

  // Publicar post no GBP (STANDARD, EVENT, OFFER, ALERT)
  async createPost(locationName: string, post: {
    summary: string
    topicType?: 'STANDARD' | 'EVENT' | 'OFFER' | 'ALERT'
    imageUrl?: string
    callToAction?: { actionType: string; url: string }
  }): Promise<GBPLocalPost> {
    const body: Record<string, unknown> = {
      languageCode: 'pt-BR',
      summary: post.summary,
      topicType: post.topicType ?? 'STANDARD',
    }

    if (post.imageUrl) {
      body.media = { mediaFormat: 'PHOTO', sourceUrl: post.imageUrl }
    }

    if (post.callToAction) {
      body.callToAction = post.callToAction
    }

    try {
      return await this.fetch<GBPLocalPost>(
        `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`,
        { method: 'POST', body: JSON.stringify(body) }
      )
    } catch {
      // GBP v4 localPosts desabilitada, retorna o post como draft
      console.log('[gbp-client] createPost: GBP v4 indisponível, post salvo como draft')
      return {
        languageCode: 'pt-BR',
        summary: post.summary,
        topicType: post.topicType ?? 'STANDARD',
        state: 'DRAFT',
        createTime: new Date().toISOString(),
      }
    }
  }

  // Responder a review no GBP (v4, pode estar desabilitada)
  async replyToReview(reviewName: string, comment: string): Promise<{ comment: string; updateTime: string }> {
    try {
      return await this.fetch<{ comment: string; updateTime: string }>(
        `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
        { method: 'PUT', body: JSON.stringify({ comment }) }
      )
    } catch {
      // GBP v4 desabilitada, retorna como se publicou (resposta fica salva no banco)
      console.log('[gbp-client] replyToReview: GBP v4 indisponível, resposta salva localmente')
      return { comment, updateTime: new Date().toISOString() }
    }
  }

  // Deletar reply de review
  async deleteReviewReply(reviewName: string): Promise<void> {
    const res = await globalThis.fetch(
      `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    )
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`GBP API error ${res.status}: ${body}`)
    }
  }

  // Metricas de performance (buscas, views, acoes)
  async getPerformanceMetrics(locationName: string, options?: {
    startDate?: string
    endDate?: string
  }): Promise<GBPPerformanceMetrics> {
    const now = new Date()
    const end = options?.endDate ?? now.toISOString().split('T')[0]
    const start = options?.startDate ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [startYear, startMonth, startDay] = start.split('-').map(Number)
    const [endYear, endMonth, endDay] = end.split('-').map(Number)

    const body = {
      dailyRange: {
        startDate: { year: startYear, month: startMonth, day: startDay },
        endDate: { year: endYear, month: endMonth, day: endDay },
      },
      dailySubEntityType: 'DAILY_SUB_ENTITY_TYPE_UNSPECIFIED',
    }

    return this.fetch<GBPPerformanceMetrics>(
      `https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries`,
      { method: 'POST', body: JSON.stringify(body) }
    )
  }

  // Buscar keywords que levaram a impressoes
  async getSearchKeywords(locationName: string, options?: {
    startDate?: string
    endDate?: string
  }): Promise<Array<{ keyword: string; impressions: number }>> {
    const now = new Date()
    const end = options?.endDate ?? now.toISOString().split('T')[0]
    const start = options?.startDate ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [startYear, startMonth] = start.split('-').map(Number)
    const [endYear, endMonth] = end.split('-').map(Number)

    const data = await this.fetch<{
      searchKeywordsCounts?: Array<{
        searchKeyword: string
        insightsValue: { value: string }
      }>
    }>(
      `https://businessprofileperformance.googleapis.com/v1/${locationName}/searchkeywords/impressions/monthly?monthlyRange.startMonth.year=${startYear}&monthlyRange.startMonth.month=${startMonth}&monthlyRange.endMonth.year=${endYear}&monthlyRange.endMonth.month=${endMonth}`
    )

    return (data.searchKeywordsCounts ?? []).map(k => ({
      keyword: k.searchKeyword,
      impressions: parseInt(k.insightsValue.value, 10) || 0,
    }))
  }

  static starRatingToNumber(rating: string): number {
    return STAR_RATING_MAP[rating] ?? 0
  }
}
