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

export class GBPClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async fetch<T>(url: string): Promise<T> {
    const res = await globalThis.fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
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
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,categories,storefrontAddress,phoneNumbers,regularHours,profile,attributes,serviceItems,metadata`
    const data = await this.fetch<{ locations?: GBPLocation[] }>(url)
    return data.locations ?? []
  }

  async listReviews(locationName: string): Promise<GBPReview[]> {
    const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=50`
    const data = await this.fetch<{ reviews?: GBPReview[] }>(url)
    return data.reviews ?? []
  }

  async listMedia(locationName: string): Promise<GBPMediaItem[]> {
    const url = `https://mybusiness.googleapis.com/v4/${locationName}/media?pageSize=100`
    const data = await this.fetch<{ mediaItems?: GBPMediaItem[] }>(url)
    return data.mediaItems ?? []
  }

  static starRatingToNumber(rating: string): number {
    return STAR_RATING_MAP[rating] ?? 0
  }
}
