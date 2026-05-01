// =============================================================================
// DESTAKA — Google Business Profile API client
// Docs: https://developers.google.com/my-business/reference/businessinformation/rest
// =============================================================================

const ACCOUNT_MGMT_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1'
const BUSINESS_INFO_URL = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const PERFORMANCE_URL = 'https://businessprofileperformance.googleapis.com/v1'

export interface GmbLocation {
  name: string           // "accounts/{accountId}/locations/{locationId}"
  title: string
  address: string        // formatted
  phone: string | null
  website: string | null
  category: string | null
}

interface RawAccount {
  name: string
  accountName: string
  type: string
}

interface RawLocation {
  name: string
  title: string
  storefrontAddress?: {
    addressLines?: string[]
    locality?: string
    administrativeArea?: string
  }
  phoneNumbers?: {
    primaryPhone?: string
  }
  websiteUri?: string
  categories?: {
    primaryCategory?: {
      displayName?: string
    }
  }
}

function formatAddress(raw: RawLocation): string {
  const addr = raw.storefrontAddress
  if (!addr) return ''
  const lines = addr.addressLines ?? []
  const parts = [...lines, addr.locality, addr.administrativeArea].filter(Boolean)
  return parts.join(', ')
}

async function fetchJson<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GMB API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export async function listGmbLocations(accessToken: string): Promise<GmbLocation[]> {
  const accountsData = await fetchJson<{ accounts?: RawAccount[] }>(
    `${ACCOUNT_MGMT_URL}/accounts`,
    accessToken
  )

  const accounts = accountsData.accounts ?? []
  if (accounts.length === 0) return []

  const READ_MASK = 'name,title,storefrontAddress,phoneNumbers,websiteUri,categories'
  const allLocations: GmbLocation[] = []

  for (const account of accounts) {
    try {
      const locData = await fetchJson<{ locations?: RawLocation[] }>(
        `${BUSINESS_INFO_URL}/${account.name}/locations?readMask=${READ_MASK}`,
        accessToken
      )

      for (const loc of locData.locations ?? []) {
        allLocations.push({
          name: loc.name,
          title: loc.title,
          address: formatAddress(loc),
          phone: loc.phoneNumbers?.primaryPhone ?? null,
          website: loc.websiteUri ?? null,
          category: loc.categories?.primaryCategory?.displayName ?? null,
        })
      }
    } catch (err) {
      // Uma conta com erro (ex: tipo PERSONAL retornando 404) não deve
      // bloquear as demais. Loga e continua.
      console.warn(`[gmb/client] Erro ao buscar locations de ${account.name}:`, err)
    }
  }

  return allLocations
}

export interface GmbMetrics {
  viewsSearch: number
  viewsMaps: number
  clicksWebsite: number
  clicksCall: number
  clicksDirections: number
  period: string
}

interface DailyMetricTimeSeries {
  dailyMetric: string
  timeSeries: {
    datedValues?: Array<{
      date: { year: number; month: number; day: number }
      value?: string
    }>
  }
}

interface MultiDailyMetricsResponse {
  multiDailyMetricTimeSeries?: Array<{
    dailyMetrics: string[]
    dailySubEntityType?: unknown
    timeSeries: {
      datedValues?: Array<{
        date: { year: number; month: number; day: number }
        values?: Array<{ metric: string; value?: string }>
      }>
    }
  }>
}

function sumTimeSeries(series: DailyMetricTimeSeries['timeSeries']): number {
  return (series.datedValues ?? []).reduce((acc, d) => acc + (parseInt(d.value ?? '0', 10) || 0), 0)
}

export async function getGmbMetrics(
  accessToken: string,
  locationName: string // "locations/{locationId}"
): Promise<GmbMetrics> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - 29)

  const fmt = (d: Date) => ({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  })

  const METRICS = [
    'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
    'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
    'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
    'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
    'CALL_CLICKS',
    'WEBSITE_CLICKS',
    'BUSINESS_DIRECTION_REQUESTS',
  ]

  const params = new URLSearchParams({
    'dailyRange.startDate.year': String(fmt(startDate).year),
    'dailyRange.startDate.month': String(fmt(startDate).month),
    'dailyRange.startDate.day': String(fmt(startDate).day),
    'dailyRange.endDate.year': String(fmt(endDate).year),
    'dailyRange.endDate.month': String(fmt(endDate).month),
    'dailyRange.endDate.day': String(fmt(endDate).day),
  })
  METRICS.forEach(m => params.append('dailyMetrics', m))

  const url = `${PERFORMANCE_URL}/${locationName}:fetchMultiDailyMetricsTimeSeries?${params}`
  const data = await fetchJson<MultiDailyMetricsResponse>(url, accessToken)

  const totals: Record<string, number> = {}
  for (const group of data.multiDailyMetricTimeSeries ?? []) {
    for (const entry of group.timeSeries.datedValues ?? []) {
      for (const v of entry.values ?? []) {
        totals[v.metric] = (totals[v.metric] ?? 0) + (parseInt(v.value ?? '0', 10) || 0)
      }
    }
  }

  return {
    viewsSearch:
      (totals['BUSINESS_IMPRESSIONS_DESKTOP_SEARCH'] ?? 0) +
      (totals['BUSINESS_IMPRESSIONS_MOBILE_SEARCH'] ?? 0),
    viewsMaps:
      (totals['BUSINESS_IMPRESSIONS_DESKTOP_MAPS'] ?? 0) +
      (totals['BUSINESS_IMPRESSIONS_MOBILE_MAPS'] ?? 0),
    clicksWebsite: totals['WEBSITE_CLICKS'] ?? 0,
    clicksCall: totals['CALL_CLICKS'] ?? 0,
    clicksDirections: totals['BUSINESS_DIRECTION_REQUESTS'] ?? 0,
    period: 'Últimos 30 dias',
  }
}

// ---------------------------------------------------------------------------
// Location detail (inclui horários, serviços, atributos)
// ---------------------------------------------------------------------------

export interface RawLocationDetail {
  name?: string
  title?: string
  phoneNumbers?: { primaryPhone?: string }
  storefrontAddress?: { addressLines?: string[]; locality?: string; administrativeArea?: string }
  websiteUri?: string
  categories?: { primaryCategory?: { displayName?: string } }
  regularHours?: { periods?: Array<{ openDay?: string; openTime?: string; closeTime?: string }> }
  openInfo?: { status?: string }
  serviceItems?: Array<{
    freeFormServiceItem?: { label?: { displayName?: string; description?: string } }
    structuredServiceItem?: { serviceTypeId?: string; description?: string }
  }>
  attributes?: Array<{ name?: string; values?: string[] }>
}

export async function getLocationDetails(
  accessToken: string,
  locationName: string // "accounts/{id}/locations/{id}"
): Promise<RawLocationDetail> {
  const READ_MASK = 'name,title,phoneNumbers,storefrontAddress,websiteUri,categories,regularHours,openInfo,serviceItems,attributes'
  return fetchJson<RawLocationDetail>(
    `${BUSINESS_INFO_URL}/${locationName}?readMask=${encodeURIComponent(READ_MASK)}`,
    accessToken
  )
}

// ---------------------------------------------------------------------------
// Location media (fotos)
// ---------------------------------------------------------------------------

export interface RawMediaItem {
  name?: string
  mediaFormat?: string
  locationAssociation?: { category?: string }
}

export async function getLocationMedia(
  accessToken: string,
  locationName: string
): Promise<RawMediaItem[]> {
  const data = await fetchJson<{ mediaItems?: RawMediaItem[] }>(
    `${BUSINESS_INFO_URL}/${locationName}/media`,
    accessToken
  ).catch(() => ({ mediaItems: [] as RawMediaItem[] }))
  return data.mediaItems ?? []
}

// ---------------------------------------------------------------------------
// Location PATCH (escrita na GBP API)
// ---------------------------------------------------------------------------

export async function patchLocation(
  accessToken: string,
  locationName: string, // "accounts/{id}/locations/{id}"
  updateMask: string,
  body: Record<string, unknown>
): Promise<void> {
  const res = await fetch(
    `${BUSINESS_INFO_URL}/${locationName}?updateMask=${encodeURIComponent(updateMask)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GBP PATCH [${updateMask}] ${res.status}: ${text}`)
  }
}
